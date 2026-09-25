import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as XLSX from 'xlsx';

/**
 * THE ROOT CAUSE (2026-09-22 outage):
 * The source table used to be a native Google Sheet, which is why the old
 * code hit Google's Sheets CSV export endpoint
 * (docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=<gid>).
 * The source owner has since switched to maintaining an actual .xlsx file
 * uploaded to Google Drive. That export endpoint only serves native Sheets
 * documents - for an uploaded Excel file it returns 410 Gone, which is
 * exactly the error that started showing up in the logs. It has nothing to
 * do with column layout; the request itself was failing before any parsing
 * happened.
 *
 * THE FIX: fetch the file's raw bytes from Drive's binary download endpoint
 * (works for any file type, Sheets or Excel, as long as it's shared as
 * "Anyone with the link") and parse the workbook directly with the `xlsx`
 * package instead of asking Google to convert it to CSV first. This also
 * means we're no longer coupled to a `gid` (tab id) - we read every tab by
 * name, which matters because of the second change below.
 *
 * FILE_ID default is the id from the Drive link shared on 2026-09-25.
 * Override via the DEVICES_FILE_ID env var if the source file moves again
 * (Project Settings -> Environment Variables), without touching code.
 */
const FILE_ID = process.env.DEVICES_FILE_ID ?? '1uwxmXBBy6Dz3F8U_Pr5ON49zXZI68o-V';
const FILE_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

/**
 * SECOND CHANGE, same source update: discontinued devices used to live in
 * the same sheet as active ones, flagged only via a note in the הערות
 * column (see EXCLUDED_NOTE_PATTERNS below). The source owner has since
 * split them out into their own tab. We read both tabs and merge them -
 * rows from the discontinued tab are always flagged discontinued, rows from
 * the active tab keep the old note-based check too (belt and suspenders, in
 * case the source ever mixes the two approaches again).
 *
 * Override the tab names via env vars if the source renames them.
 */
const ACTIVE_SHEET_NAME = process.env.DEVICES_ACTIVE_SHEET ?? 'עלויות דגמי מכשירים ויתרה לסיום';
const DISCONTINUED_SHEET_NAME = process.env.DEVICES_DISCONTINUED_SHEET ?? 'דגמים שהוצאו מרשימת הבחירה';

// Same drift problem as before, still worth matching several variants.
const EXCLUDED_NOTE_PATTERNS = ['הוצא מרשימת הדגמים', 'יצא מרשימת הדגמים'];

/**
 * Header cells can carry a stray newline (the "עלות ליסינג חודשית" header
 * currently has one baked in), leading/trailing spaces, or a Hebrew
 * gershayim (״) instead of a straight double quote in "מע"מ" - normalize
 * all of that away so a cosmetic edit in the sheet doesn't silently break
 * every row again the way the verb-form drift did before.
 */
function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u05F3\u05F4\u2018\u2019\u201C\u201D]/g, '"')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Parses a shekel-formatted cell. The xlsx parser hands us numbers
 * directly for numeric cells (unlike the old CSV-text path), but we still
 * accept a string here in case a cell is formatted as text with a ₪ sign.
 * Returns null (not 0!) when the value is missing or unparseable, so the
 * caller can drop the row instead of silently showing a device that costs
 * "₪0" because someone fat-fingered a cell in the sheet.
 */
function parseShekel(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value ?? '').replace(/[₪,]/g, '').trim();
  if (cleaned === '') return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parses the memory (GB) cell. Same null-not-0 rule as parseShekel - a
 * malformed "128GB" (unit left in the cell) should drop the row, not
 * silently become "0GB".
 */
function parseMemoryGb(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value ?? '').trim();
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
 * (e.g. two colour variants of the same manufacturer+model+storage combo,
 * or the same model appearing on both the active and discontinued tabs).
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

type RawDevice = {
  manufacturer: string;
  model: string;
  memoryGb: number;
  leaseMonthly: number;
  buyoutEnd: number;
  weightedListPrice: number;
  priceTier: string;
  updatedAt?: string;
  notes?: string;
  discontinued: boolean;
};

/**
 * Parses one tab of the workbook into device rows. `forceDiscontinued`
 * marks every row from that tab as discontinued regardless of its note
 * text - used for the "removed from selection" tab.
 */
function parseDeviceSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  forceDiscontinued: boolean,
  skipped: string[],
): RawDevice[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Expected sheet "${sheetName}" was not found in the workbook`);
  }

  // Same two-header-row layout as before: row 1 (index 0) is a merged
  // group title, the real column names live in row 2 (index 1).
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });

  if (rows.length < 3) {
    throw new Error(`Sheet "${sheetName}" returned fewer rows than expected - layout may have changed`);
  }

  const headerRow = rows[1].map(normalizeHeader);
  const dataRows = rows.slice(2);

  const records = dataRows.map((row) => {
    const record: Record<string, unknown> = {};
    headerRow.forEach((key, idx) => {
      record[key] = row[idx];
    });
    return record;
  });

  return records
    .filter((row) => String(row['יצרן'] ?? '').trim() && String(row['דגם מכשיר'] ?? '').trim())
    .map((row): RawDevice | null => {
      const manufacturer = String(row['יצרן']).trim();
      const model = String(row['דגם מכשיר']).trim();

      const memoryGb = parseMemoryGb(row['נפח זיכרון (GB)']);
      const leaseMonthly = parseShekel(row['עלות ליסינג חודשית, כולל מע"מ']);
      const buyoutEnd = parseShekel(row['עלות רכישת מכשיר בסוף תקופה, כולל מע"מ']);
      const weightedListPrice = parseShekel(row['מחיר מחירון משוקלל, כולל מע"מ']);

      // Any of these being unparseable means we don't actually know the
      // real numbers for this device - showing it with a silent "0" would
      // be worse than not showing it at all in a cost calculator.
      if (memoryGb === null || leaseMonthly === null || buyoutEnd === null || weightedListPrice === null) {
        skipped.push(`[${sheetName}] ${manufacturer} ${model}`);
        return null;
      }

      const notes = String(row['הערות'] ?? '').trim() || undefined;
      const updatedAtRaw = row['תאריך עדכון אחרון והפסקת מכירה'];
      const updatedAt = updatedAtRaw instanceof Date
        ? updatedAtRaw.toISOString().slice(0, 10)
        : String(updatedAtRaw ?? '').trim() || undefined;

      return {
        manufacturer,
        model,
        memoryGb,
        leaseMonthly,
        buyoutEnd,
        weightedListPrice,
        priceTier: String(row['שיוך מכשיר למדרגת מחיר לחישוב השתתפות עצמית'] ?? '').trim(),
        updatedAt,
        notes,
        discontinued: forceDiscontinued || EXCLUDED_NOTE_PATTERNS.some((pattern) => (notes ?? '').includes(pattern)),
      };
    })
    .filter((device): device is RawDevice => device !== null);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fileResponse = await fetch(FILE_DOWNLOAD_URL);
    if (!fileResponse.ok) {
      throw new Error(`Google Drive file download failed with status ${fileResponse.status}`);
    }
    const arrayBuffer = await fileResponse.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    const skipped: string[] = [];
    const activeRows = parseDeviceSheet(workbook, ACTIVE_SHEET_NAME, false, skipped);
    const discontinuedRows = parseDeviceSheet(workbook, DISCONTINUED_SHEET_NAME, true, skipped);

    if (skipped.length > 0) {
      console.error('Skipped rows with invalid/missing pricing data:', skipped);
    }

    const nextId = makeIdFactory();
    const devices = [...activeRows, ...discontinuedRows].map((row) => ({
      id: nextId(slugify(row.manufacturer, row.model, row.memoryGb)),
      ...row,
    }));

    // Cache at Vercel's edge for an hour, serve stale for a day while
    // refreshing in the background - avoids hitting Google on every request.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(devices);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Failed to load devices from the source file' });
  }
}
