import { useEffect, useMemo, useState } from 'react';

import SelectionPage from './pages/SelectionPage';
import DashboardPage from './pages/DashboardPage';
import type { DashboardSelection, Device, GradeBand, GradeLookupTable, GradeType } from './types';
import { loadDevices, loadGradeBands, loadGradeLookup, loadTerminationRules } from './services/data';
import { resolveGradeBand } from './services/calculations';

const defaultSelection: DashboardSelection = {
  selectedDeviceId: '',
  selectedGradeType: 'מח"ר / מהנדסים',
  selectedRank: '42',
  selectedMonth: 12,
};

export default function App() {
  const [page, setPage] = useState<'selection' | 'dashboard'>('selection');
  const [devices, setDevices] = useState<Device[]>([]);
  const [gradeBands, setGradeBands] = useState<GradeBand[]>([]);
  const [gradeLookup, setGradeLookup] = useState<GradeLookupTable>({});
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<DashboardSelection>(defaultSelection);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const [devicesData, bandsData, lookupData] = await Promise.all([
          loadDevices(),
          loadGradeBands(),
          loadGradeLookup(),
          loadTerminationRules(),
        ]);

        if (!active) return;

        setDevices(devicesData);
        setGradeBands(bandsData);
        setGradeLookup(lookupData);
        setSelection((current) => ({
          ...current,
          selectedDeviceId: devicesData[0]?.id ?? '',
        }));
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();

    return () => {
      active = false;
    };
  }, []);

  // Grade types come from the lookup table itself, not a hardcoded list -
  // if you add a new track to gradeLookup.json, it shows up automatically.
  const gradeTypes = useMemo(() => Object.keys(gradeLookup) as GradeType[], [gradeLookup]);

  // Each grade type has its own rank scale, so the rank dropdown depends on
  // whichever grade type is currently selected.
  const ranks = useMemo(
    () => (gradeLookup[selection.selectedGradeType] ?? []).map((entry) => entry.rank),
    [gradeLookup, selection.selectedGradeType]
  );

  // If the grade type changes and the currently selected rank doesn't exist
  // for the new type, snap to the first valid rank for that type instead of
  // silently keeping an invalid selection.
  useEffect(() => {
    if (ranks.length > 0 && !ranks.includes(selection.selectedRank)) {
      setSelection((current) => ({ ...current, selectedRank: ranks[0] }));
    }
  }, [ranks, selection.selectedRank]);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selection.selectedDeviceId) ?? devices[0],
    [devices, selection.selectedDeviceId]
  );

  const selectedBand = useMemo(
    () => resolveGradeBand(selection.selectedRank, selection.selectedGradeType, gradeBands, gradeLookup),
    [gradeBands, gradeLookup, selection.selectedGradeType, selection.selectedRank]
  );

  const canContinue = Boolean(selectedDevice && selectedBand);

  if (page === 'selection') {
    return (
      <SelectionPage
        devices={devices}
        selectedDeviceId={selection.selectedDeviceId}
        selectedGradeType={selection.selectedGradeType}
        selectedRank={selection.selectedRank}
        gradeTypes={gradeTypes}
        ranks={ranks}
        bandLabel={selectedBand?.label ?? 'Loading...'}
        bandContribution={selectedBand?.employeeContribution ?? 0}
        onDeviceChange={(value) => setSelection((current) => ({ ...current, selectedDeviceId: value }))}
        onGradeTypeChange={(value) => setSelection((current) => ({ ...current, selectedGradeType: value }))}
        onRankChange={(value) => setSelection((current) => ({ ...current, selectedRank: value }))}
        onContinue={() => setPage('dashboard')}
        canContinue={canContinue}
        loading={loading}
      />
    );
  }

  if (!selectedDevice || !selectedBand) {
    return (
      <div className="min-h-screen p-6">
        <p>Missing data.</p>
      </div>
    );
  }

  return (
    <DashboardPage
      device={selectedDevice}
      band={selectedBand}
      selectedMonth={selection.selectedMonth}
      selectedRank={selection.selectedRank}
      selectedGradeType={selection.selectedGradeType}
      devices={devices}
      onBack={() => setPage('selection')}
      onMonthChange={(value) => setSelection((current) => ({ ...current, selectedMonth: value }))}
      onResetMonth={() => setSelection((current) => ({ ...current, selectedMonth: 12 }))}
    />
  );
}
