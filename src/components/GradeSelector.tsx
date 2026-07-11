import type { GradeType } from '../types';

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
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Employee selection</h2>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Grade type</span>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
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
          <span className="mb-1 block text-sm text-slate-600">Rank</span>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
            value={rank}
            onChange={(e) => onRankChange(e.target.value)}
          >
            {ranks.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Mapped band: <span className="font-semibold text-slate-900">{bandLabel}</span>
          <div className="mt-1">Monthly allowance: {bandContribution.toFixed(2)} ILS</div>
        </div>
      </div>
    </div>
  );
}
