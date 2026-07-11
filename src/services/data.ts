import type { Device, GradeBand, GradeLookupTable, TerminationRule } from '../types';

const DEVICES_URL = '/data/devices.json';
const GRADE_BANDS_URL = '/data/gradeBands.json';
const TERMINATION_RULES_URL = '/data/terminationRules.json';
const GRADE_LOOKUP_URL = '/data/gradeLookup.json';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function loadDevices(): Promise<Device[]> {
  return fetchJson<Device[]>(DEVICES_URL);
}

export async function loadGradeBands(): Promise<GradeBand[]> {
  return fetchJson<GradeBand[]>(GRADE_BANDS_URL);
}

export async function loadTerminationRules(): Promise<TerminationRule[]> {
  return fetchJson<TerminationRule[]>(TERMINATION_RULES_URL);
}

// Replaces the old loadMappings() - this now loads the real rank -> band
// lookup table (per grade type) generated from grade_to_cellular_grade.xlsx,
// instead of the old flat "one band per grade type" mapping.
export async function loadGradeLookup(): Promise<GradeLookupTable> {
  return fetchJson<GradeLookupTable>(GRADE_LOOKUP_URL);
}
