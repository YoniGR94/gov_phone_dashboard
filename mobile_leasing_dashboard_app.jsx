import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ChevronRight, Phone, RefreshCw } from "lucide-react";

type GradeType = "מח"ר" | "מנהלי" | "אחר";

type Device = {
  id: string;
  manufacturer: string;
  model: string;
  memoryGb: number;
  leaseMonthly: number;
  buyoutEnd: number;
  weightedListPrice: number;
  priceTier: string;
};

type GradeBand = {
  id: string;
  label: string;
  range: string;
  employeeContribution: number;
};

type ChartPoint = {
  month: number;
  employeeMonthly: number;
  officeMonthly: number;
  cumulativeEmployee: number;
  exitCost: number;
  buyoutAtEnd: number;
};

const DATA_SOURCES = {
  devices: "URL1",
  grades: "URL2",
  rules: "URL3",
  mappings: "URL4",
};

const DEVICES: Device[] = [
  {
    id: "iphone-15",
    manufacturer: "Apple",
    model: "iPhone 15",
    memoryGb: 128,
    leaseMonthly: 117.5,
    buyoutEnd: 2190,
    weightedListPrice: 3499,
    priceTier: "פרימיום",
  },
  {
    id: "s24",
    manufacturer: "Samsung",
    model: "Galaxy S24",
    memoryGb: 256,
    leaseMonthly: 102.9,
    buyoutEnd: 1990,
    weightedListPrice: 3290,
    priceTier: "פרימיום",
  },
  {
    id: "pixel-9",
    manufacturer: "Google",
    model: "Pixel 9",
    memoryGb: 128,
    leaseMonthly: 88.4,
    buyoutEnd: 1590,
    weightedListPrice: 2790,
    priceTier: "בינוני+",
  },
  {
    id: "a55",
    manufacturer: "Samsung",
    model: "Galaxy A55",
    memoryGb: 128,
    leaseMonthly: 58.2,
    buyoutEnd: 990,
    weightedListPrice: 1690,
    priceTier: "בינוני",
  },
];

const GRADE_BANDS: GradeBand[] = [
  { id: "grade-a", label: "מדרג בכיר", range: "42 ומעלה", employeeContribution: 177 },
  { id: "grade-b", label: "מדרג תיכון", range: "40-41", employeeContribution: 118 },
  { id: "grade-c", label: "מדרג מירב", range: "39 ומטה", employeeContribution: 88.5 },
  { id: "only-sim", label: "ONLY SIM", range: "ללא מכשיר", employeeContribution: 11.06 },
];

const GRADE_TYPES: GradeType[] = ["מח\"ר", "מנהלי", "אחר"];
const RANK_OPTIONS = Array.from({ length: 16 }, (_, i) => `${27 + i}`);

function money(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(value);
}

function buildChartData(device: Device, gradeBand: GradeBand): ChartPoint[] {
  const officeMonthly = Math.max(device.leaseMonthly - gradeBand.employeeContribution, 0);
  const monthlyGrowth = officeMonthly;
  const buyoutEnd = device.buyoutEnd;

  return Array.from({ length: 24 }, (_, idx) => {
    const month = idx + 1;
    const remainingMonths = 24 - month;
    const exitCost = month < 24 ? device.weightedListPrice - monthlyGrowth * month : buyoutEnd;
    return {
      month,
      employeeMonthly: monthlyGrowth,
      officeMonthly: gradeBand.employeeContribution,
      cumulativeEmployee: monthlyGrowth * month,
      exitCost: Math.max(exitCost, 0),
      buyoutAtEnd,
    };
  });
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}

function ChartShell({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {note ? <p className="mt-1 text-sm text-gray-500">{note}</p> : null}
        </div>
      </div>
      <div className="h-72 w-full">{children}</div>
    </div>
  );
}

export default function MobileLeasingDashboardApp() {
  const [page, setPage] = useState<"step1" | "step2">("step1");
  const [selectedDeviceId, setSelectedDeviceId] = useState(DEVICES[0].id);
  const [selectedGradeType, setSelectedGradeType] = useState<GradeType>("מח\"ר");
  const [selectedRank, setSelectedRank] = useState("42");
  const [selectedMonth, setSelectedMonth] = useState(12);

  const selectedDevice = useMemo(
    () => DEVICES.find((d) => d.id === selectedDeviceId) ?? DEVICES[0],
    [selectedDeviceId]
  );

  const selectedGradeBand = useMemo(() => {
    const rank = Number(selectedRank);
    if (selectedGradeType === "אחר") return GRADE_BANDS[3];
    if (rank >= 42) return GRADE_BANDS[0];
    if (rank >= 40) return GRADE_BANDS[1];
    return GRADE_BANDS[2];
  }, [selectedGradeType, selectedRank]);

  const chartData = useMemo(
    () => buildChartData(selectedDevice, selectedGradeBand),
    [selectedDevice, selectedGradeBand]
  );

  const currentPoint = chartData[selectedMonth - 1];
  const selectedComparisonSet = DEVICES.slice(0, 3);

  const canContinue = Boolean(selectedDevice && selectedGradeType && selectedRank);

  if (page === "step1") {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm shadow-sm ring-1 ring-slate-200">
                <Phone className="h-4 w-4" />
                מחשבון ליסינג טלפונים לעובדי המדינה
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">בחירת טלפון, סוג דרגה ודרגה</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                הנתונים נטענים באופן עקרוני מ־{DATA_SOURCES.devices}, {DATA_SOURCES.grades}, {DATA_SOURCES.rules} ו־{DATA_SOURCES.mappings}.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              disabled={!canContinue}
              onClick={() => setPage("step2")}
            >
              המשך לדאשבורד
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold">בחירת מכשיר</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {DEVICES.map((device) => {
                  const active = device.id === selectedDeviceId;
                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => setSelectedDeviceId(device.id)}
                      className={`rounded-2xl border p-4 text-right transition ${
                        active ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold">{device.manufacturer} {device.model}</div>
                          <div className="mt-1 text-sm text-slate-500">{device.memoryGb}GB · {device.priceTier}</div>
                        </div>
                        <div className="text-sm font-medium text-slate-700">{money(device.leaseMonthly)} לחודש</div>
                      </div>
                      <div className="mt-3 text-sm text-slate-500">
                        עלות קנייה בסוף תקופה: {money(device.buyoutEnd)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">פרטי עובד</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-600">סוג דרגה</span>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
                    value={selectedGradeType}
                    onChange={(e) => setSelectedGradeType(e.target.value as GradeType)}
                  >
                    {GRADE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-slate-600">דרגה</span>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value)}
                  >
                    {RANK_OPTIONS.map((rank) => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </label>

                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  שיוך אוטומטי למדרג: <span className="font-semibold text-slate-900">{selectedGradeBand.label}</span>
                  <div className="mt-1">מכסת השתתפות: {money(selectedGradeBand.employeeContribution)}</div>
                </div>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() => setPage("step2")}
                >
                  צפייה בגרפים
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">דאשבורד ליסינג טלפונים</h1>
            <p className="mt-1 text-sm text-slate-600">
              {selectedDevice.manufacturer} {selectedDevice.model} · {selectedGradeType} · דרגה {selectedRank} · {selectedGradeBand.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
              onClick={() => setPage("step1")}
            >
              <ArrowLeft className="h-4 w-4" />
              חזור
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
              onClick={() => setSelectedMonth(12)}
              title="איפוס תצוגת החודש"
            >
              <RefreshCw className="h-4 w-4" />
              איפוס תצוגה
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard title="עלות חודשית לעובד" value={money(currentPoint.employeeMonthly)} subtitle="החלק שנותר לאחר השתתפות המשרד" />
          <SummaryCard title="השתתפות חודשית משרדית" value={money(currentPoint.officeMonthly)} subtitle="לפי מדרג ותנאי הזכאות" />
          <SummaryCard title="עלות רכישה בסוף תקופה" value={money(selectedDevice.buyoutEnd)} subtitle="בסוף 24 חודשים" />
          <SummaryCard title="עלות מצטברת עד חודש נוכחי" value={money(currentPoint.cumulativeEmployee)} subtitle={`חודש ${selectedMonth} מתוך 24`} />
          <SummaryCard title="עלות יציאה אם עוזבים עכשיו" value={money(currentPoint.exitCost)} subtitle="חישוב סימולציה לפי החודש שנבחר" />
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">סליידר חודשי</h2>
              <p className="text-sm text-slate-500">שנה את החודש כדי לראות את העלות המצטברת ואת מחיר היציאה המוקדמת.</p>
            </div>
            <div className="min-w-[280px]">
              <input
                type="range"
                min={1}
                max={24}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>חודש 1</span>
                <span>חודש 24</span>
              </div>
              <div className="mt-2 text-sm font-medium">חודש נבחר: {selectedMonth}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartShell title="עלות חודשית לעובד מול משרד" note="הגרף מציג את חלוקת העלות החודשית בין העובד למשרד.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(0, 24)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="employeeMonthly" name="עובד" />
                <Bar dataKey="officeMonthly" name="משרד" />
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell title="עלות מצטברת לעובד" note="כמה העובד כבר שילם עד כל חודש נבחר.">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number) => money(v)} />
                <Line type="monotone" dataKey="cumulativeEmployee" name="עלות מצטברת" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell title="עלות יציאה מוקדמת לפי חודש" note="הסימולציה מראה את מחיר היציאה אם העובד עוזב לפני סיום 24 חודשים.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="exitCost" name="עלות יציאה מוקדמת">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.month === selectedMonth ? "#2563eb" : "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell title="עלות כוללת ל־24 חודשים" note="השוואה בין המכשיר שנבחר לבין מכשירים נוספים במדגם.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedComparisonSet.map((device) => ({
                name: `${device.manufacturer} ${device.model}`,
                total: device.leaseMonthly * 24 + device.buyoutEnd,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="total" name="עלות כוללת">
                  {selectedComparisonSet.map((_, index) => (
                    <Cell key={`cmp-${index}`} fill={index === 0 ? "#111827" : index === 1 ? "#475569" : "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>

          <div className="rounded-2xl border bg-white p-4 shadow-sm xl:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">השוואת מכשירים</h3>
                <p className="text-sm text-slate-500">טבלת השוואה קצרה למכשירים שנבחרו להצגה.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600">
                    <th className="px-3 py-2 font-medium">יצרן ודגם</th>
                    <th className="px-3 py-2 font-medium">זיכרון</th>
                    <th className="px-3 py-2 font-medium">חודשי</th>
                    <th className="px-3 py-2 font-medium">קנייה בסוף</th>
                    <th className="px-3 py-2 font-medium">סה״כ 24 ח׳</th>
                  </tr>
                </thead>
                <tbody>
                  {DEVICES.map((device) => (
                    <tr key={device.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{device.manufacturer} {device.model}</td>
                      <td className="px-3 py-2">{device.memoryGb}GB</td>
                      <td className="px-3 py-2">{money(device.leaseMonthly)}</td>
                      <td className="px-3 py-2">{money(device.buyoutEnd)}</td>
                      <td className="px-3 py-2">{money(device.leaseMonthly * 24 + device.buyoutEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
