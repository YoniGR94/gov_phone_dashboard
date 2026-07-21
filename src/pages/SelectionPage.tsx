import { Info, Smartphone, TriangleAlert, X } from 'lucide-react';

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
  showDisclaimer: boolean;
  onDismissDisclaimer: () => void;
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
  showDisclaimer,
  onDismissDisclaimer,
}: Props) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* התראה ידידותית, לא חוסמת - מוצגת רק בטעינה/רענון ראשוני של האתר.
            המצב עצמו (showDisclaimer) חי ב-state של App.tsx בלבד, בלי
            localStorage/sessionStorage, כדי שתתאפס בכל רענון אמיתי אבל
            תישאר סגורה כשעוברים לדשבורד וחוזרים למסך הזה בתוך אותה טעינה. */}
        {showDisclaimer && (
          <div className="glass-card mb-6 flex items-start gap-3 border-amber-400/60 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">כלי עזר לא רשמי</p>
              <p className="mt-0.5 text-sm text-slate-600">
                המחשבון מבוסס על מידע פומבי בלבד ועלול להכיל טעויות או אי-דיוקים. בכל מקרה של סתירה בין המוצג כאן
                לבין הוראות התכ"ם התקפות, ובפרט הוראה 16.7.1 - הוראות התכ"ם הן המחייבות, והמחשבון אינו מהווה תחליף להן.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissDisclaimer}
              aria-label="סגירת ההודעה"
              className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
              המחשבון נועד לעזור לכם לקבל החלטה מושכלת בבחירת המכשיר, וכן בבחינת הכניסה או היציאה מהסכם הליסינג.
              המערכת תחשב עבורכם את העלות החודשית, ההשתתפות של המשרד ואת עלות היציאה המוקדמת מהליסינג.
            </p>
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || loading}
            className="glass-button-primary w-full lg:w-auto"
          >
            {loading ? 'טוען נתונים...' : 'מעבר ללוח תוצאות'}
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

        {/* סדר הבחירה: דרגה לפני מכשיר. ה-GradeSelector מגיע ראשון ב-DOM כך
            שבמובייל (תצוגת עמודה אחת) הוא מוצג מעל DeviceSelector. */}
        <div className="grid gap-4 lg:grid-cols-3">
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
          <div className="lg:col-span-2">
            <DeviceSelector devices={devices} selectedDeviceId={selectedDeviceId} onChange={onDeviceChange} />
          </div>
        </div>

        {/* כפתור שני לפתיחת הדאשבורד + קרדיט, כדי שיהיו נגישים גם בתחתית הדף
            (חוץ מהכפתור הקיים בראש הדף). */}
        <div className="mt-8 flex flex-col items-center gap-5 border-t border-slate-400/25 pt-6">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || loading}
            className="glass-button-primary w-full sm:w-auto"
          >
            {loading ? 'טוען נתונים...' : 'מעבר ללוח תוצאות'}
          </button>
          <Credit />
        </div>
      </div>
    </div>
  );
}
