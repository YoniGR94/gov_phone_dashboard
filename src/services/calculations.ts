import type { ChartPoint, Device, GradeBand, GradeLookupTable } from '../types';

/**
 * Formats a number as Israeli Shekel currency (he-IL locale).
 */
export function money(value: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Resolves which GradeBand applies to a given rank + grade type, using the
 * real lookup table generated from grade_to_cellular_grade.xlsx
 * (public/data/gradeLookup.json).
 *
 * Each grade type has its own rank scale (e.g. rank "42" means something
 * different for "מינהלי" than it does for "מח\"ר / מהנדסים"), and some
 * grade types use rank titles ("אלוף", "רב סרן") instead of numbers - so
 * `rank` is matched as an exact string, not a numeric range.
 *
 * Returns undefined if the rank doesn't exist for that grade type in the
 * lookup table (e.g. stale selection after switching grade type) or the
 * referenced band id isn't in gradeBands - callers should treat that as
 * "no valid selection yet".
 */
export function resolveGradeBand(
  rank: string,
  gradeType: string,
  gradeBands: GradeBand[],
  gradeLookup: GradeLookupTable
): GradeBand | undefined {
  const entries = gradeLookup[gradeType];
  if (!entries) return undefined;

  const match = entries.find((entry) => entry.rank === rank);
  if (!match) return undefined;

  return gradeBands.find((band) => band.id === match.bandId);
}

/**
 * Monthly amount the employee actually pays out of pocket for the device
 * lease, after the ministry's subsidy (band.employeeContribution) is
 * applied. Never negative — if the subsidy exceeds the lease cost, the
 * employee pays 0.
 */
export function calculateMonthlyEmployeeCost(device: Device, band: GradeBand): number {
  return Math.max(device.leaseMonthly - band.employeeContribution, 0);
}

/**
 * Monthly amount the ministry/office actually covers. Capped at the
 * device's lease cost — the office never pays more than the lease itself.
 */
export function calculateMonthlyOfficeCost(device: Device, band: GradeBand): number {
  return Math.min(band.employeeContribution, device.leaseMonthly);
}

/**
 * Monthly cost of the SIM-only (device-free) plan option - office-funded,
 * fixed per the regulation's Appendix ("תוכנית חבילת דיבור הודעות וגלישה
 * סים אונלי/SIM ONLY"). That option has no device and no lease commitment,
 * so it's used below as the baseline subtracted from a device's lease
 * cost: the difference is the portion of the monthly payment that's
 * actually financing the device itself.
 *
 * This is a fixed policy constant, not sheet data - update it here if the
 * appendix is revised.
 */
export const SIM_ONLY_MONTHLY_COST = 11.06;

/**
 * Payment owed to the supplier to buy the device out before the 24-month
 * lease ends, per the regulation's Appendix formula: G = A * (B - C) + E
 *   A = months remaining until month 24 (NOT months already paid)
 *   B = device's full monthly lease cost (device.leaseMonthly - the gross
 *       amount, not reduced by the ministry's subsidy; the subsidy only
 *       affects the employee's monthly out-of-pocket cost during an
 *       active lease, it plays no part in the buyout math)
 *   C = SIM_ONLY_MONTHLY_COST
 *   E = device's end-of-lease buyout price (device.buyoutEnd)
 *
 * This is a linear function of `month` that lands exactly on E (the flat
 * buyout price) at month 24, since A is 0 there - no special-cased
 * "if month >= 24" branch needed.
 */
export function calculateExitCost(device: Device, month: number): number {
  const monthsRemaining = 24 - month; // A
  // Floored so a device priced below the SIM-only baseline (bad sheet
  // data) can't flip the formula into an increasing function instead of
  // a decreasing one.
  const devicePortion = Math.max(device.leaseMonthly - SIM_ONLY_MONTHLY_COST, 0); // B - C
  return monthsRemaining * devicePortion + device.buyoutEnd;
}

/**
 * Employee's total cost across the full 24-month lease, including the
 * end-of-lease buyout price.
 */
export function calculateTotal24Months(device: Device, band: GradeBand): number {
  const employeeMonthly = calculateMonthlyEmployeeCost(device, band);
  return employeeMonthly * 24 + device.buyoutEnd;
}

/**
 * Picks the devices actually worth showing in the "total cost" comparison
 * chart: the employee's selected device, plus the cheapest and priciest
 * alternatives (by full 24-month cost including buyout). Previously this
 * was just `devices.slice(0, 3)` - the first 3 rows in sheet order, with no
 * relationship to what the employee picked, which made the chart's own
 * title ("comparison") inaccurate.
 */
export function buildComparisonDevices(devices: Device[], selected: Device): Device[] {
  const totalCost = (d: Device) => d.leaseMonthly * 24 + d.buyoutEnd;
  const others = devices
    .filter((d) => d.id !== selected.id)
    .sort((a, b) => totalCost(a) - totalCost(b));

  const cheapest = others[0];
  const priciest = others[others.length - 1];

  const set = [selected, cheapest, priciest].filter(
    (d, index, arr): d is Device => Boolean(d) && arr.findIndex((x) => x?.id === d.id) === index
  );

  return set;
}

/**
 * Builds the month-by-month series (1-24) that drives the dashboard charts.
 */
export function buildChartData(device: Device, band: GradeBand): ChartPoint[] {
  const employeeMonthly = calculateMonthlyEmployeeCost(device, band);
  const officeMonthly = calculateMonthlyOfficeCost(device, band);

  return Array.from({ length: 24 }, (_, idx) => {
    const month = idx + 1;
    return {
      month,
      employeeMonthly,
      officeMonthly,
      cumulativeEmployee: employeeMonthly * month,
      exitCost: calculateExitCost(device, month),
      buyoutAtEnd: device.buyoutEnd,
    };
  });
}
