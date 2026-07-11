export type GradeType = 'מח"ר' | 'מנהלי' | 'אחר';

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

export type GradeBand = {
  id: string;
  label: string;
  range: string;
  minGrade?: number;
  maxGrade?: number;
  employeeContribution: number;
  notes?: string;
};

export type TerminationRule = {
  scenario: string;
  description: string;
  formula: string;
};

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
