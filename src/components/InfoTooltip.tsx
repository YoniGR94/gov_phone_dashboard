import { useState } from 'react';
import { Info } from 'lucide-react';

type Props = {
  /** טקסט ההסבר שיוצג בבועית ה-hover, בעברית */
  text: string;
};

/**
 * אייקון "i" קטן שממוקם בפינה השמאלית העילית של כרטיס/פאנל (position: absolute,
 * יחסי להורה עם position: relative - כמו glass-card). מעביר עכבר / פוקוס /
 * הקשה (מובייל) עליו חושפים בועית הסבר בעברית. ההורה הישיר צריך overflow
 * גלוי (overflow-visible) כדי שהבועית לא תיחתך על ידי overflow-hidden של glass-card.
 */
export default function InfoTooltip({ text }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="group absolute left-2 top-2 z-20"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="הסבר על הנתון"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-500/15 text-slate-500 ring-1 ring-slate-400/30 transition hover:bg-indigo-500/20 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      <div
        role="tooltip"
        dir="rtl"
        className={`absolute left-0 top-full z-30 mt-2 w-60 rounded-xl bg-slate-900/95 p-3 text-right text-xs leading-relaxed text-white shadow-lg backdrop-blur-sm transition duration-150 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
