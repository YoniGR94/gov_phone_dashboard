import { money } from '../services/calculations';

type Props = {
  employeeMonthly: number;
  officeMonthly: number;
  buyoutEnd: number;
  cumulativeEmployee: number;
  exitCost: number;
};

function Card({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}

export default function SummaryCards({
  employeeMonthly,
  officeMonthly,
  buyoutEnd,
  cumulativeEmployee,
  exitCost,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card title="Employee monthly cost" value={money(employeeMonthly)} subtitle="After ministry contribution" />
      <Card title="Ministry monthly contribution" value={money(officeMonthly)} subtitle="Based on grade band" />
      <Card title="Buyout at end of lease" value={money(buyoutEnd)} subtitle="At month 24" />
      <Card title="Accumulated employee cost" value={money(cumulativeEmployee)} subtitle="Up to the selected month" />
      <Card title="Exit cost now" value={money(exitCost)} subtitle="Early termination simulation" />
    </div>
  );
}
