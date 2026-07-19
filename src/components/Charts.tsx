import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
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
const COLOR_UNUSED = '#cbd5e1'; // slate-300 - "בזבוז" של מכסה שלא נוצלה

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
  // כמה מהמכסה החודשית (band.employeeContribution) נוצלה בפועל:
  // - officeUsed: מה שהמשרד בפועל שילם (מוגבל למכסה)
  // - employeeExcess: אם המכשיר עולה יותר מהמכסה - מה שהעובד משלם מכיסו מעבר לה
  // - unusedQuota: אם המכשיר עולה פחות מהמכסה - כמה מהמכסה נשאר "על השולחן"
  // employeeExcess ו-unusedQuota הם תרתי-דסתרי מבחינה מתמטית - לא יתכן ששניהם
  // גדולים מ-0 יחד, כי אחד הוא max(0,lease-quota) והשני max(0,quota-lease).
  const officeUsed = chartData[0]?.officeMonthly ?? 0;
  const employeeExcess = chartData[0]?.employeeMonthly ?? 0;
  const quota = band.employeeContribution;
  const unusedQuota = Math.max(quota - officeUsed, 0);

  const utilizationData = [
    {
      name: 'ניצול המכסה',
      officeUsed,
      employeeExcess,
      unusedQuota,
    },
  ];

  const utilizationSubtitle =
    employeeExcess > 0
      ? `נוצלה כל המכסה (${money(quota)}) + ${money(employeeExcess)} מכיסו של העובד`
      : unusedQuota > 0
        ? `נוצלו ${money(officeUsed)} מתוך מכסה של ${money(quota)} · ${money(unusedQuota)} לא מנוצלים`
        : `נוצלה כל המכסה של ${money(quota)}, במדויק`;

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
      <ChartPanel title="ניצול מכסת ההשתתפות החודשית" subtitle={utilizationSubtitle}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={utilizationData}
            layout="vertical"
            margin={{ top: 24, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v: number) => money(v)} />
            <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={90} />
            <Tooltip formatter={(v: number) => money(v)} />
            <Legend />
            <ReferenceLine x={quota} stroke="#0f172a" strokeDasharray="4 4">
              <Label value={`מכסה: ${money(quota)}`} position="top" fontSize={11} fill="#0f172a" />
            </ReferenceLine>
            <Bar dataKey="officeUsed" name="השתתפות שנוצלה (משרד)" stackId="a" fill={COLOR_OFFICE} radius={[6, 0, 0, 6]} />
            <Bar dataKey="employeeExcess" name="תוספת מכיסו של העובד" stackId="a" fill={COLOR_EMPLOYEE} radius={[0, 6, 6, 0]} />
            <Bar dataKey="unusedQuota" name="מכסה שלא נוצלה" stackId="a" fill={COLOR_UNUSED} radius={[0, 6, 6, 0]} />
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
