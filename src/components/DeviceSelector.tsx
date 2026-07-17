import { useMemo, useState } from 'react';
import { Smartphone } from 'lucide-react';

import type { Device } from '../types';
import { money } from '../services/calculations';

type Props = {
  devices: Device[];
  selectedDeviceId: string;
  onChange: (deviceId: string) => void;
};

const ALL = 'all';

export default function DeviceSelector({ devices, selectedDeviceId, onChange }: Props) {
  const [manufacturerFilter, setManufacturerFilter] = useState<string>(ALL);
  const [memoryFilter, setMemoryFilter] = useState<string>(ALL);

  const manufacturers = useMemo(
    () => Array.from(new Set(devices.map((d) => d.manufacturer))).sort((a, b) => a.localeCompare(b)),
    [devices]
  );

  const memoryOptions = useMemo(
    () => Array.from(new Set(devices.map((d) => d.memoryGb))).sort((a, b) => a - b),
    [devices]
  );

  const filteredDevices = useMemo(
    () =>
      devices.filter(
        (d) =>
          (manufacturerFilter === ALL || d.manufacturer === manufacturerFilter) &&
          (memoryFilter === ALL || d.memoryGb === Number(memoryFilter))
      ),
    [devices, manufacturerFilter, memoryFilter]
  );

  const filtersActive = manufacturerFilter !== ALL || memoryFilter !== ALL;

  return (
    <div className="glass-panel p-5">
      <h2 className="font-display text-lg font-semibold text-slate-900">בחירת מכשיר</h2>

      {devices.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm text-slate-600">יצרן</span>
            <select
              className="glass-select"
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
            >
              <option value={ALL}>הכל</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="block flex-1">
            <span className="mb-1.5 block text-sm text-slate-600">נפח זיכרון (GB)</span>
            <select className="glass-select" value={memoryFilter} onChange={(e) => setMemoryFilter(e.target.value)}>
              <option value={ALL}>הכל</option>
              {memoryOptions.map((gb) => (
                <option key={gb} value={gb}>
                  {gb}GB
                </option>
              ))}
            </select>
          </label>

          {filtersActive && (
            <button
              type="button"
              className="glass-button-secondary sm:mb-0.5"
              onClick={() => {
                setManufacturerFilter(ALL);
                setMemoryFilter(ALL);
              }}
            >
              נקה סינון
            </button>
          )}
        </div>
      )}

      {devices.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-400/60 bg-white/30 px-4 py-10 text-center">
          <Smartphone className="h-8 w-8 text-slate-400" strokeWidth={1.75} />
          <p className="mt-3 text-sm font-medium text-slate-600">לא נמצאו מכשירים זמינים כרגע</p>
          <p className="mt-1 text-xs text-slate-500">נסו לרענן את הדף בעוד כמה דקות.</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-400/60 bg-white/30 px-4 py-10 text-center">
          <Smartphone className="h-8 w-8 text-slate-400" strokeWidth={1.75} />
          <p className="mt-3 text-sm font-medium text-slate-600">אין מכשירים התואמים לסינון שנבחר</p>
          <button
            type="button"
            className="glass-button-secondary mt-3"
            onClick={() => {
              setManufacturerFilter(ALL);
              setMemoryFilter(ALL);
            }}
          >
            נקה סינון
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredDevices.map((device) => {
            const active = device.id === selectedDeviceId;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => onChange(device.id)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-right transition ${
                  active
                    ? 'border-indigo-500 bg-indigo-50/70 shadow-[0_0_0_3px_rgba(79,70,229,0.35)]'
                    : 'border-slate-400/50 bg-white/40 hover:border-slate-500/60 hover:bg-white/60'
                }`}
              >
                <div className="text-lg font-semibold text-slate-900">
                  {device.manufacturer} {device.model}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {device.memoryGb}GB · {device.priceTier}
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  ליסינג חודשי: {money(device.leaseMonthly)} · רכישה בסוף התקופה: {money(device.buyoutEnd)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
