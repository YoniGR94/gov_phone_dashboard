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

    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      // Normalize header whitespace - the sheet's real headers contain
      // irregular double/triple spaces (e.g. "כולל    מע\"מ"), so match on
      // a cleaned-up version rather than the exact raw string.
      transformHeader: (header) => header.trim().replace(/\s+/g, ' '),
    });

    if (errors.length > 0) {
      console.error('CSV parse warnings:', errors);
    }

    const devices = data
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
