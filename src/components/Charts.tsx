import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ChartPoint, Device } from '../types';
import { money } from '../services/calculations';

type Props = {
  chartData: ChartPoint[];
  selectedMonth: number;
  comparisonDevices: Device[];
};

export default function Charts({ chartData, selectedMonth, comparisonDevices }: Props) {
  const comparisonData = comparisonDevices.map((device) => ({
    name: `${device.manufacturer} ${device.model}`,
    total: device.leaseMonthly * 24 + device.buyoutEnd,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Employee vs ministry monthly cost</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => money(v)} />
              <Legend />
              <Bar dataKey="employeeMonthly" name="Employee" />
              <Bar dataKey="officeMonthly" name="Ministry" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Accumulated employee cost</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => money(v)} />
              <Line type="monotone" dataKey="cumulativeEmployee" name="Accumulated cost" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Early exit cost by month</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="exitCost" name="Exit cost">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.month === selectedMonth ? '#2563eb' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">24-month total cost comparison</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="total" name="Total cost">
                {comparisonData.map((_, index) => (
                  <Cell key={index} fill={index === 0 ? '#111827' : index === 1 ? '#475569' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
