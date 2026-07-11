import type { Device, GradeType } from '../types';
import DeviceSelector from '../components/DeviceSelector';
import GradeSelector from '../components/GradeSelector';

type Props = {
  devices: Device[];
  selectedDeviceId: string;
  selectedGradeType: GradeType;
  selectedRank: string;
  gradeTypes: GradeType[];
  ranks: string[];
  bandLabel: string;
  bandContribution: number;
  onDeviceChange: (value: string) => void;
  onGradeTypeChange: (value: GradeType) => void;
  onRankChange: (value: string) => void;
  onContinue: () => void;
  canContinue: boolean;
  loading: boolean;
};

export default function SelectionPage({
  devices,
  selectedDeviceId,
  selectedGradeType,
  selectedRank,
  gradeTypes,
  ranks,
  bandLabel,
  bandContribution,
  onDeviceChange,
  onGradeTypeChange,
  onRankChange,
  onContinue,
  canContinue,
  loading,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full bg-white px-3 py-1 text-sm shadow-sm ring-1 ring-slate-200">
              Government mobile leasing dashboard
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Choose device, grade type and rank</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Data is loaded from public JSON files in the project and can later be replaced by public Google Sheets URLs.
            </p>
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Open dashboard'}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DeviceSelector devices={devices} selectedDeviceId={selectedDeviceId} onChange={onDeviceChange} />
          </div>
          <GradeSelector
            gradeType={selectedGradeType}
            rank={selectedRank}
            onGradeTypeChange={onGradeTypeChange}
            onRankChange={onRankChange}
            gradeTypes={gradeTypes}
            ranks={ranks}
            bandLabel={bandLabel}
            bandContribution={bandContribution}
          />
        </div>
      </div>
    </div>
  );
}
