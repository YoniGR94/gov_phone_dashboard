import { useEffect, useMemo, useState } from 'react';

import SelectionPage from './pages/SelectionPage';
import DashboardPage from './pages/DashboardPage';
import type { DashboardSelection, Device, GradeBand, GradeType, TerminationRule } from './types';
import { loadDevices, loadGradeBands, loadMappings, loadTerminationRules } from './services/data';
import { resolveGradeBand } from './services/calculations';

const gradeTypes: GradeType[] = ['מח"ר', 'מנהלי', 'אחר'];
const ranks = Array.from({ length: 16 }, (_, i) => `${27 + i}`);

const defaultSelection: DashboardSelection = {
  selectedDeviceId: '',
  selectedGradeType: 'מח"ר',
  selectedRank: '42',
  selectedMonth: 12,
};

export default function App() {
  const [page, setPage] = useState<'selection' | 'dashboard'>('selection');
  const [devices, setDevices] = useState<Device[]>([]);
  const [gradeBands, setGradeBands] = useState<GradeBand[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<TerminationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<DashboardSelection>(defaultSelection);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const [devicesData, bandsData, mappingsData, rulesData] = await Promise.all([
          loadDevices(),
          loadGradeBands(),
          loadMappings(),
          loadTerminationRules(),
        ]);

        if (!active) return;

        setDevices(devicesData);
        setGradeBands(bandsData);
        setMappings(mappingsData);
        setRules(rulesData);
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

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selection.selectedDeviceId) ?? devices[0],
    [devices, selection.selectedDeviceId]
  );

  const selectedBand = useMemo(() => {
    const rank = Number(selection.selectedRank);
    return resolveGradeBand(rank, selection.selectedGradeType, gradeBands, mappings);
  }, [gradeBands, mappings, selection.selectedGradeType, selection.selectedRank]);

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
