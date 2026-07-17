import { Smartphone, TriangleAlert } from 'lucide-react';

import type { Device, GradeType } from '../types';
import DeviceSelector from '../components/DeviceSelector';
import GradeSelector from '../components/GradeSelector';
import Credit from '../components/Credit';

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
  loadError: boolean;
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
  loadError,
}: Props) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <span className="glass-pill">
              <Smartphone className="h-4 w-4" />
              ליסינג טלפון נייד לעובדי מדינה
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900">
              בחרו מכשיר, קבוצת דרגה ודרגה
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              המערכת תחשב עבורכם את העלות החודשית, ההשתתפות של המשרד ואת עלות היציאה המוקדמת מהליסינג.
            </p>
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || loading}
            className="glass-button-primary w-full lg:w-auto"
          >
            {loading ? 'טוען נתונים...' : 'פתיחת לוח המחוונים'}
          </button>
        </div>

        {loadError && (
          <div className="glass-card mb-6 flex items-start gap-3 border-rose-400/60 p-4">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">טעינת הנתונים נכשלה</p>
              <p className="mt-0.5 text-sm text-slate-600">רעננו את הדף, ואם התקלה נמשכת פנו לגורם התומך.</p>
            </div>
          </div>
        )}

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

        <Credit />
      </div>
    </div>
  );
}
