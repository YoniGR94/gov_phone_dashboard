import { Share2 } from 'lucide-react';

const SHARE_TEXT = 'מחשבון ליסינג טלפון לעובדי מדינה - בדקו בעצמכם איזה מסלול משתלם לכם:';

/**
 * Floating share button, fixed in a bottom corner on every screen (selection
 * + dashboard) so it's always reachable without ever sitting on top of the
 * page's own buttons/sliders.
 *
 * Uses the native Web Share API when the browser supports it (mobile Chrome/
 * Safari, and most modern desktop browsers) - that opens the device's own
 * share sheet, so WhatsApp/Teams/email/etc. are all one tap away and the
 * user picks whichever they want. Only browsers without that API (mainly
 * older desktop browsers) fall back to opening a WhatsApp share link
 * directly, since that's the channel most people asked for.
 */
export default function ShareButton() {
  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'מחשבון ליסינג טלפון', text: SHARE_TEXT, url });
      } catch {
        // המשתמש סגר את חלון השיתוף בלי לבחור - אין צורך לעשות כלום.
      }
      return;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="שיתוף המחשבון"
      title="שיתוף המחשבון"
      className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-slate-500/30 bg-white/70 text-slate-700 shadow-[0_12px_30px_-12px_rgba(30,27,75,0.55)] backdrop-blur-xl transition hover:bg-white/90 hover:text-indigo-600 active:scale-95"
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}
