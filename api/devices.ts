import type { VercelRequest, VercelResponse } from '@vercel/node';
import Papa from 'papaparse';

/**
 * This runs on Vercel's server, not in the browser - that's the whole point.
 * Google's /export?format=csv endpoint doesn't reliably send CORS headers,
 * so a direct fetch() from client-side JS can fail. Server-to-server has no
 * CORS restriction at all, so we fetch here and hand the browser clean JSON
 * from our own domain instead.
 *
 * SHEET_ID / SHEET_GID can be overridden via Vercel environment variables
 * (Project Settings -> Environment Variables) without touching code.
 */
const SHEET_ID = process.env.DEVICES_SHEET_ID ?? '13HhcspJ_P0jnCmdz7icVeKQJCGWdur5vJ0wWfM5Wu_I';
const SHEET_GID = process.env.DEVICES_SHEET_GID ?? '1768756835';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const EXCLUDED_NOTE = 'יצא מרשימת הדגמים';

/**
 * Parses a shekel-formatted cell ("₪1,234", "1234", etc).
 * Returns null (not 0!) when the value is missing or unparseable, so the
 * caller can drop the row instead of silently showing a device that costs
 * "₪0" because someone fat-fingered a cell in the sheet.
 */
function parseShekel(value: string | undefined): number | null {
  const cleaned = (value ?? '').replace(/[₪,]/g, '').trim();
  if (cleaned === '') return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parses the memory (GB) cell. Same null-not-0 rule as parseShekel - a
 * malformed "128GB" (unit left in the cell) should drop the row, not
 * silently become "0GB".
 */
function parseMemoryGb(value: string | undefined): number | null {
  const cleaned = (value ?? '').trim();
  if (cleaned === '') return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function slugify(...parts: (string | number)[]): string {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Guarantees a unique id even if two sheet rows produce the same slug
 * (e.g. two colour variants of the same manufacturer+model+storage combo).
 * Without this, duplicate ids collide in React keys and in the
 * devices.find(id === ...) lookup used to resolve the selected device.
 */
function makeIdFactory() {
  const seen = new Map<string, number>();
  return (base: string): string => {
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sheetResponse = await fetch(SHEET_CSV_URL);
    if (!sheetResponse.ok) {
      throw new Error(`Google Sheets export failed with status ${sheetResponse.status}`);
    }
    const csvText = await sheetResponse.text();

    // The sheet has TWO header rows: row 1 is a merged group title
    // ("עלויות דגמי מכשיר ליסינג" etc, mostly empty cells), and the real
    // column names (יצרן, דגם מכשיר, ...) live in row 2. Parsing with
    // `header: true` would wrongly treat row 1 as the header row, so we
    // parse as raw arrays instead and pick out row index 1 as the header.
    const { data: rows, errors } = Papa.parse<string[]>(csvText, {
      skipEmptyLines: 'greedy',
    });

    if (errors.length > 0) {
      console.error('CSV parse warnings:', errors);
    }

    if (rows.length < 3) {
      throw new Error('Sheet returned fewer rows than expected - layout may have changed');
    }

    const headerRow = rows[1].map((header) => header.trim().replace(/\s+/g, ' '));
    const dataRows = rows.slice(2);

    const records = dataRows.map((row) => {
      const record: Record<string, string> = {};
      headerRow.forEach((key, idx) => {
        record[key] = row[idx] ?? '';
      });
      return record;
    });

    const nextId = makeIdFactory();
    const skipped: string[] = [];

    const devices = records
      .filter((row) => row['יצרן'] && row['דגם מכשיר'])
      .map((row) => {
        const manufacturer = row['יצרן'].trim();
        const model = row['דגם מכשיר'].trim();

        const memoryGb = parseMemoryGb(row['נפח זיכרון (GB)']);
        const leaseMonthly = parseShekel(row['עלות ליסינג חודשית, כולל מע"מ']);
        const buyoutEnd = parseShekel(row['עלות רכישת מכשיר בסוף תקופה, כולל מע"מ']);
        const weightedListPrice = parseShekel(row['מחיר מחירון משוקלל, כולל מע"מ']);

        // Any of these being unparseable means we don't actually know the
        // real numbers for this device - showing it with a silent "0" would
        // be worse than not showing it at all in a cost calculator.
        if (memoryGb === null || leaseMonthly === null || buyoutEnd === null || weightedListPrice === null) {
          skipped.push(`${manufacturer} ${model}`);
          return null;
        }

        return {
          id: nextId(slugify(manufacturer, model, memoryGb)),
          manufacturer,
          model,
          memoryGb,
          leaseMonthly,
          buyoutEnd,
          weightedListPrice,
          priceTier: (row['שיוך מכשיר למדרגת מחיר לחישוב השתתפות עצמית'] ?? '').trim(),
          updatedAt: (row['תאריך עדכון אחרון והפסקת מכירה'] ?? '').trim() || undefined,
          notes: (row['הערות'] ?? '').trim() || undefined,
          // Still shown in the selector (so employees who already have this
          // device, or want to compare against it, can pick it) - just
          // flagged so the UI can mark it as no longer purchasable.
          // Matches by substring, not exact equality - the sheet's note
          // text isn't always byte-for-byte identical (e.g. extra words
          // before/after, trailing punctuation).
          discontinued: (row['הערות'] ?? '').includes(EXCLUDED_NOTE),
        };
      })
      .filter((device): device is NonNullable<typeof device> => device !== null);

    if (skipped.length > 0) {
      console.error('Skipped rows with invalid/missing pricing data:', skipped);
    }

    // Cache at Vercel's edge for an hour, serve stale for a day while
    // refreshing in the background - avoids hitting Google on every request.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(devices);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Failed to load devices from Google Sheets' });
  }
}
