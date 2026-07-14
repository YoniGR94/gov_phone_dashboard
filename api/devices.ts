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

const EXCLUDED_NOTE = 'הוצא מרשימת הדגמים לבחירה';

function parseShekel(value: string): number {
  const cleaned = value.replace(/[₪,]/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function slugify(...parts: (string | number)[]): string {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/\s+/g, '-');
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

    const devices = records
      .filter((row) => row['יצרן'] && row['דגם מכשיר'])
      .filter((row) => (row['הערות'] ?? '').trim() !== EXCLUDED_NOTE)
      .map((row) => {
        const manufacturer = row['יצרן'].trim();
        const model = row['דגם מכשיר'].trim();
        const memoryGb = Number(row['נפח זיכרון (GB)']) || 0;

        return {
          id: slugify(manufacturer, model, memoryGb),
          manufacturer,
          model,
          memoryGb,
          leaseMonthly: parseShekel(row['עלות ליסינג חודשית, כולל מע"מ'] ?? ''),
          buyoutEnd: parseShekel(row['עלות רכישת מכשיר בסוף תקופה, כולל מע"מ'] ?? ''),
          weightedListPrice: parseShekel(row['מחיר מחירון משוקלל, כולל מע"מ'] ?? ''),
          priceTier: (row['שיוך מכשיר למדרגת מחיר לחישוב השתתפות עצמית'] ?? '').trim(),
          updatedAt: (row['תאריך עדכון אחרון והפסקת מכירה'] ?? '').trim() || undefined,
          notes: (row['הערות'] ?? '').trim() || undefined,
        };
      });

    // Cache at Vercel's edge for an hour, serve stale for a day while
    // refreshing in the background - avoids hitting Google on every request.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(devices);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Failed to load devices from Google Sheets' });
  }
}
