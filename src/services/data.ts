import type { Device, GradeBand, TerminationRule } from '../types';

const DEVICES_URL = '/data/devices.json';
const GRADE_BANDS_URL = '/data/gradeBands.json';
const TERMINATION_RULES_URL = '/data/terminationRules.json';
const MAPPINGS_URL = '/data/mappings.json';

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

export async function loadMappings(): Promise<Record<string, string>> {
  return fetchJson<Record<string, string>>(MAPPINGS_URL);
}
