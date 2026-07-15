// The 9 real grade tracks, taken directly from public/data/grade_to_cellular_grade.xlsx.
// Numeric tracks (מינהלי, מח"ר / מהנדסים, הנדסאים / טכנאים) use a numeric rank as a string.
// Rank-title tracks (צהל, משטרה, שב"ס, כב"א) and the lawyers/social-work scales use
// a text label instead of a number - that's why `rank` is a string everywhere, not a number.
export type GradeType =
  | 'מינהלי'
  | 'מח"ר / מהנדסים'
  | 'הנדסאים / טכנאים'
  | 'משפטנים'
  | 'עובדים סוציאליים (כולל בריאות ובתיה"ח)'
  | 'צהל'
  | 'משטרה'
  | 'שב"ס'
  | 'כב"א';

export type Device = {
  id: string;
  manufacturer: string;
  model: string;
  memoryGb: number;
  leaseMonthly: number;
  buyoutEnd: number;
  weightedListPrice: number;
  priceTier: string;
  updatedAt?: string;
  notes?: string;
};

// One of the 5 real participation tiers (בכיר א / בכיר ב / תיכון / מירב / מסד).
// No more minGrade/maxGrade here - the actual rank -> tier relationship is
// looked up per grade type via GradeLookupTable below, because the ranges
// are different for every track (e.g. rank 42 means something different for
// מינהלי than it does for מח"ר).
export type GradeBand = {
  id: string;
  label: string;
  employeeContribution: number;
  notes?: string;
};

// One row of the real lookup table: within a given GradeType, this rank maps
// to this band id.
export type GradeLookupEntry = {
  rank: string;
  bandId: string;
};

// public/data/gradeLookup.json shape: GradeType -> ordered list of rank/band rows.
export type GradeLookupTable = Record<string, GradeLookupEntry[]>;

export type ChartPoint = {
  month: number;
  employeeMonthly: number;
  officeMonthly: number;
  cumulativeEmployee: number;
  exitCost: number;
  buyoutAtEnd: number;
};

export type DashboardSelection = {
  selectedDeviceId: string;
  selectedGradeType: GradeType;
  selectedRank: string;
  selectedMonth: number;
};
