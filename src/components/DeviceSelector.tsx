import { Smartphone } from 'lucide-react';

import type { Device } from '../types';
import { money } from '../services/calculations';

type Props = {
  devices: Device[];
  selectedDeviceId: string;
  onChange: (deviceId: string) => void;
};

export default function DeviceSelector({ devices, selectedDeviceId, onChange }: Props) {
  return (
    <div className="glass-panel p-5">
      <h2 className="font-display text-lg font-semibold text-slate-900">בחירת מכשיר</h2>

      {devices.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/70 bg-white/30 px-4 py-10 text-center">
          <Smartphone className="h-8 w-8 text-slate-400" strokeWidth={1.75} />
          <p className="mt-3 text-sm font-medium text-slate-600">לא נמצאו מכשירים זמינים כרגע</p>
          <p className="mt-1 text-xs text-slate-500">נסו לרענן את הדף בעוד כמה דקות.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {devices.map((device) => {
            const active = device.id === selectedDeviceId;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => onChange(device.id)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-right transition ${
                  active
                    ? 'border-indigo-400/70 bg-indigo-50/70 shadow-[0_0_0_3px_rgba(99,102,241,0.25)]'
                    : 'border-white/60 bg-white/40 hover:bg-white/60'
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
