import { ArrowLeft, RefreshCw } from 'lucide-react';

import type { Device, GradeBand, GradeType } from '../types';
import { buildChartData, calculateExitCost, calculateMonthlyEmployeeCost, calculateMonthlyOfficeCost, calculateTotal24Months, money } from '../services/calculations';
import SummaryCards from '../components/SummaryCards';
import Charts from '../components/Charts';

type Props = {
  device: Device;
  band: GradeBand;
  selectedMonth: number;
  selectedRank: string;
  selectedGradeType: GradeType;
  devices: Device[];
  onBack: () => void;
  onMonthChange: (value: number) => void;
  onResetMonth: () => void;
};

export default function DashboardPage({
  device,
  band,
  selectedMonth,
  selectedRank,
  selectedGradeType,
  devices,
  onBack,
  onMonthChange,
  onResetMonth,
}: Props) {
  const chartData = buildChartData(device, band);
  const point = chartData[selectedMonth - 1];
  const employeeMonthly = calculateMonthlyEmployeeCost(device, band);
  const officeMonthly = calculateMonthlyOfficeCost(device, band);
  const exitCost = calculateExitCost(device, selectedMonth, band);
  const total24Months = calculateTotal24Months(device, band);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              {device.manufacturer} {device.model} · {selectedGradeType} · rank {selectedRank} · {band.label}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
              onClick={onResetMonth}
              title="Reset month"
            >
              <RefreshCw className="h-4 w-4" />
              Reset view
            </button>
          </div>
        </div>

        <SummaryCards
          employeeMonthly={employeeMonthly}
          officeMonthly={officeMonthly}
          buyoutEnd={device.buyoutEnd}
          cumulativeEmployee={point.cumulativeEmployee}
          exitCost={exitCost}
        />

        <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Month slider</h2>
              <p className="text-sm text-slate-500">Move the slider to simulate early termination and cumulative cost.</p>
            </div>
            <div className="min-w-[280px]">
              <input
                type="range"
                min={1}
                max={24}
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>1</span>
                <span>24</span>
              </div>
              <div className="mt-2 text-sm font-medium">Selected month: {selectedMonth}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Charts chartData={chartData} selectedMonth={selectedMonth} comparisonDevices={devices.slice(0, 3)} />
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">24-month summary</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-500">Employee total</div>
              <div className="mt-1 text-lg font-semibold">{money(employeeMonthly * 24)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-500">Government total</div>
              <div className="mt-1 text-lg font-semibold">{money(officeMonthly * 24)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-500">Total with buyout</div>
              <div className="mt-1 text-lg font-semibold">{money(total24Months)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
