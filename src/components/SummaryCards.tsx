import type { LucideIcon } from 'lucide-react';
import { Wallet, Landmark, PackageCheck, TrendingUp, LogOut, PiggyBank } from 'lucide-react';

import { money } from '../services/calculations';

type Props = {
  employeeMonthly: number;
  officeMonthly: number;
  buyoutEnd: number;
  cumulativeEmployee: number;
  exitCost: number;
  savedSoFar: number;
};

type Tone = 'indigo' | 'emerald' | 'violet' | 'sky' | 'rose' | 'amber';

const TONE_STYLES: Record<Tone, { icon: string; ring: string }> = {
  indigo: { icon: 'bg-indigo-500/15 text-indigo-600', ring: 'ring-indigo-200/60' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-600', ring: 'ring-emerald-200/60' },
  violet: { icon: 'bg-violet-500/15 text-violet-600', ring: 'ring-violet-200/60' },
  sky: { icon: 'bg-sky-500/15 text-sky-600', ring: 'ring-sky-200/60' },
  rose: { icon: 'bg-rose-500/15 text-rose-600', ring: 'ring-rose-200/60' },
  amber: { icon: 'bg-amber-500/15 text-amber-600', ring: 'ring-amber-200/60' },
};

function Card({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={`glass-card ring-1 ${styles.ring} p-4`}>
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}>
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="mt-3 text-sm text-slate-600">{title}</div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}

export default function SummaryCards({
  employeeMonthly,
  officeMonthly,
  buyoutEnd,
  cumulativeEmployee,
  exitCost,
  savedSoFar,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card
        title="עלות חודשית לעובד"
        value={money(employeeMonthly)}
        subtitle="לאחר השתתפות המשרד"
        icon={Wallet}
        tone="indigo"
      />
      <Card
        title="השתתפות המשרד"
        value={money(officeMonthly)}
        subtitle="לפי מדרגת ההשתתפות"
        icon={Landmark}
        tone="emerald"
      />
      <Card
        title="עלות רכישה בסוף התקופה"
        value={money(buyoutEnd)}
        subtitle="בחודש ה-24"
        icon={PackageCheck}
        tone="violet"
      />
      <Card
        title="עלות מצטברת לעובד"
        value={money(cumulativeEmployee)}
        subtitle="עד החודש הנבחר"
        icon={TrendingUp}
        tone="sky"
      />
      <Card
        title="עלות יציאה מוקדמת"
        value={money(exitCost)}
        subtitle="סימולציית סיום מוקדם כעת"
        icon={LogOut}
        tone="rose"
      />
      <Card
        title="חסכתם עד כה"
        value={money(savedSoFar)}
        subtitle="השתתפות המשרד שכבר נוצלה עד החודש הנבחר"
        icon={PiggyBank}
        tone="amber"
      />
    </div>
  );
}
