import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ChartPoint, Device, GradeBand } from '../types';
import { calculateTotal24Months, money } from '../services/calculations';

type Props = {
  chartData: ChartPoint[];
  selectedMonth: number;
  comparisonDevices: Device[];
  selectedDeviceId: string;
  band: GradeBand;
};

const COLOR_EMPLOYEE = '#6366f1'; // indigo-500
const COLOR_OFFICE = '#10b981'; // emerald-500
const COLOR_EXIT = '#94a3b8'; // slate-400
const COLOR_EXIT_ACTIVE = '#e11d48'; // rose-600
const COLOR_SELECTED = '#4f46e5'; // indigo-600
const COLOR_CHEAPEST = '#10b981'; // emerald-500
const COLOR_PRICIEST = '#fb7185'; // rose-400
const COLOR_NEUTRAL = '#94a3b8'; // slate-400

function ChartPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <h3 className="font-display text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div dir="ltr" className="mt-3 h-72 w-full">
        {children}
      </div>
    </div>
  );
}

export default function Charts({ chartData, selectedMonth, comparisonDevices, selectedDeviceId, band }: Props) {
  // employeeMonthly/officeMonthly הם ערכים קבועים לאורך כל 24 החודשים (ראו
  // calculateMonthlyEmployeeCost / calculateMonthlyOfficeCost), אז אין טעם
  // להציג אותם כסדרה חודשית שחוזרת על עצמה - משווים אותם כשתי קטגוריות.
  const monthlyComparisonData = [
    { name: 'עובד', value: chartData[0]?.employeeMonthly ?? 0 },
    { name: 'משרד', value: chartData[0]?.officeMonthly ?? 0 },
  ];

  // מסמן את החודש הנבחר על גרף העלות המצטברת, בדיוק כמו ההדגשה האדומה
  // בגרף עלות היציאה המוקדמת - כשהעיגול "מוסתר" (r=0) בשאר החודשים.
  const renderCumulativeDot = (props: { cx?: number; cy?: number; payload?: ChartPoint; index?: number }) => {
    const { cx, cy, payload, index } = props;
    const isSelected = payload?.month === selectedMonth;
    return (
      <circle
        key={`cumulative-dot-${index}`}
        cx={cx}
        cy={cy}
        r={isSelected ? 6 : 0}
        fill={COLOR_EXIT_ACTIVE}
        stroke="#ffffff"
        strokeWidth={isSelected ? 2 : 0}
      />
    );
  };

  // עלות כוללת נטו לעובד (אחרי הנחת הדרגה), לא מחיר גולמי של המכשיר - ראו
  // הערה על calculateTotal24Months ב-buildComparisonDevices.
  const totalCost = (d: Device) => calculateTotal24Months(d, band);
  const totals = comparisonDevices.map(totalCost);
  const minTotal = Math.min(...totals);
  const maxTotal = Math.max(...totals);

  const comparisonData = comparisonDevices.map((device) => {
    const total = totalCost(device);
    let color = COLOR_NEUTRAL;
    let role = '';
    if (device.id === selectedDeviceId) {
      color = COLOR_SELECTED;
      role = 'נבחר';
    } else if (total === minTotal) {
      color = COLOR_CHEAPEST;
      role = 'הכי זול';
    } else if (total === maxTotal) {
      color = COLOR_PRICIEST;
      role = 'הכי יקר';
    }
    return {
      name: `${device.manufacturer} ${device.model}`,
      total,
      color,
      role,
    };
  });

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel
        title="עלות חודשית: עובד מול משרד"
        subtitle="הסכום קבוע לאורך כל תקופת הליסינג (24 חודשים)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip formatter={(v: number) => money(v)} />
            <Bar dataKey="value" name="עלות חודשית" radius={[6, 6, 0, 0]}>
              {monthlyComparisonData.map((entry, index) => (
                <Cell key={entry.name} fill={index === 0 ? COLOR_EMPLOYEE : COLOR_OFFICE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="עלות מצטברת לעובד לאורך הזמן">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip formatter={(v: number) => money(v)} />
            <Line
              type="monotone"
              dataKey="cumulativeEmployee"
              name="עלות מצטברת"
              stroke={COLOR_SELECTED}
              strokeWidth={2.5}
              dot={renderCumulativeDot}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="עלות יציאה מוקדמת לפי חודש">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip formatter={(v: number) => money(v)} />
            <Bar dataKey="exitCost" name="עלות יציאה" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.month === selectedMonth ? COLOR_EXIT_ACTIVE : COLOR_EXIT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        title="השוואת עלות כוללת ל-24 חודשים"
        subtitle="עלות נטו בפועל לעובד לפי הדרגה שלו, לא מחיר גולמי של המכשיר"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip formatter={(v: number) => money(v)} labelFormatter={(_, payload) => payload?.[0]?.payload?.name} />
            <Bar dataKey="total" name="עלות כוללת" radius={[6, 6, 0, 0]}>
              {comparisonData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}
