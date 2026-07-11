import type { Device } from '../types';
import { money } from '../services/calculations';

type Props = {
  devices: Device[];
  selectedDeviceId: string;
  onChange: (deviceId: string) => void;
};

export default function DeviceSelector({ devices, selectedDeviceId, onChange }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Select device</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {devices.map((device) => {
          const active = device.id === selectedDeviceId;
          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onChange(device.id)}
              className={`rounded-2xl border p-4 text-right transition ${
                active ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-lg font-semibold">
                {device.manufacturer} {device.model}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {device.memoryGb}GB · {device.priceTier}
              </div>
              <div className="mt-3 text-sm text-slate-600">
                Lease: {money(device.leaseMonthly)} · Buyout: {money(device.buyoutEnd)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
