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
 * Cost to the employee if they leave the program at a given month (1-24).
 * Formula per public/data/terminationRules.json ("early_exit"):
 *   weightedListPrice - (months already paid * employee's monthly cost)
 * At month 24 (end of lease) this becomes the flat buyout price instead,
 * per the "end_of_lease" rule.
 */
export function calculateExitCost(device: Device, month: number, band: GradeBand): number {
  if (month >= 24) {
    return device.buyoutEnd;
  }
  const employeeMonthly = calculateMonthlyEmployeeCost(device, band);
  return Math.max(device.weightedListPrice - employeeMonthly * month, 0);
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
      exitCost: calculateExitCost(device, month, band),
      buyoutAtEnd: device.buyoutEnd,
    };
  });
}
