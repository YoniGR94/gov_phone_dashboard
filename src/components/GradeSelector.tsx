import type { GradeType } from '../types';
import { money } from '../services/calculations';

type Props = {
  gradeType: GradeType;
  rank: string;
  onGradeTypeChange: (value: GradeType) => void;
  onRankChange: (value: string) => void;
  gradeTypes: GradeType[];
  ranks: string[];
  bandLabel: string;
  bandContribution: number;
};

export default function GradeSelector({
  gradeType,
  rank,
  onGradeTypeChange,
  onRankChange,
  gradeTypes,
  ranks,
  bandLabel,
  bandContribution,
}: Props) {
  return (
    <div className="glass-panel p-5">
      <h2 className="font-display text-lg font-semibold text-slate-900">פרטי העובד</h2>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-slate-600">קבוצת דרגה</span>
          <select
            className="glass-select"
            value={gradeType}
            onChange={(e) => onGradeTypeChange(e.target.value as GradeType)}
          >
            {gradeTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-slate-600">דרגה</span>
          <select className="glass-select" value={rank} onChange={(e) => onRankChange(e.target.value)}>
            {ranks.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-slate-400/40 bg-white/40 p-3.5 text-sm text-slate-600">
          <div>
            מדרגת השתתפות: <span className="font-semibold text-slate-900">{bandLabel}</span>
          </div>
          <div className="mt-1">
            השתתפות חודשית של המשרד: <span className="font-semibold text-slate-900">{money(bandContribution)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
