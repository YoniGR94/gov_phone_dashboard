import { ArrowRight, RefreshCw } from 'lucide-react';

import type { Device, GradeBand, GradeType } from '../types';
import {
  buildChartData,
  buildComparisonDevices,
  calculateExitCost,
  calculateMonthlyEmployeeCost,
  calculateMonthlyOfficeCost,
  calculateTotal24Months,
  money,
} from '../services/calculations';
import SummaryCards from '../components/SummaryCards';
import Charts from '../components/Charts';
import Credit from '../components/Credit';

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
  const exitCost = calculateExitCost(device, selectedMonth);
  const total24Months = calculateTotal24Months(device, band);
  const comparisonDevices = buildComparisonDevices(devices, device);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <span className="glass-pill">לוח מחוונים</span>
            <p className="mt-2 text-sm text-slate-600">
              {device.manufacturer} {device.model} · {selectedGradeType} · דרגה {selectedRank} · {band.label}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="glass-button-secondary" onClick={onBack}>
              <ArrowRight className="h-4 w-4" />
              חזרה
            </button>
            <button type="button" className="glass-button-secondary" onClick={onResetMonth} title="איפוס תצוגה">
              <RefreshCw className="h-4 w-4" />
              איפוס תצוגה
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

        <div className="glass-panel mt-6 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">בחירת חודש בתקופת הליסינג</h2>
              <p className="text-sm text-slate-500">הזיזו את המחוון כדי לבחון עלות סיום מוקדם ועלות מצטברת.</p>
            </div>
            <div className="min-w-[280px]">
              <input
                type="range"
                min={1}
                max={24}
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="w-full accent-indigo-600"
                dir="ltr"
              />
              <div dir="ltr" className="mt-1 flex justify-between text-xs text-slate-500">
                <span>1</span>
                <span>24</span>
              </div>
              <div className="mt-2 text-sm font-medium text-slate-700">חודש נבחר: {selectedMonth}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Charts
            chartData={chartData}
            selectedMonth={selectedMonth}
            comparisonDevices={comparisonDevices}
            selectedDeviceId={device.id}
          />
        </div>

        <div className="glass-panel mt-6 p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-slate-900">סיכום 24 חודשים</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="glass-card p-3.5">
              <div className="text-sm text-slate-500">סה״כ לעובד</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{money(employeeMonthly * 24)}</div>
            </div>
            <div className="glass-card p-3.5">
              <div className="text-sm text-slate-500">סה״כ למשרד</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{money(officeMonthly * 24)}</div>
            </div>
            <div className="glass-card p-3.5">
              <div className="text-sm text-slate-500">סה״כ כולל רכישה בסוף התקופה</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{money(total24Months)}</div>
            </div>
          </div>
        </div>

        <Credit />
      </div>
    </div>
  );
}
