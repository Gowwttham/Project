import { useEffect } from 'react';
import { X, Heart, Share2, Download, Tag } from 'lucide-react';
import type { Meme } from '@/lib/supabase';

type Props = {
  meme: Meme;
  onClose: () => void;
  onLike: () => void;
  onShare: () => void;
  onDownload: () => void;
};

export default function MemeModal({ meme, onClose, onLike, onShare, onDownload }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#12151c] shadow-2xl md:grid-cols-[1.4fr_1fr]">
        {/* Media */}
        <div className="relative flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white/70 transition hover:bg-black/80 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
          {meme.media_type === 'video' ? (
            <video
              src={meme.media_url}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="max-h-[60vh] w-full rounded-xl object-contain md:max-h-[80vh]"
            />
          ) : (
            <img
              src={meme.media_url}
              alt={meme.title}
              className="max-h-[60vh] w-full rounded-xl object-contain md:max-h-[80vh]"
            />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="pr-2 text-lg font-bold leading-tight">{meme.title}</h2>
            <button
              onClick={onClose}
              className="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white md:grid"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {meme.description && (
              <p className="text-sm leading-relaxed text-white/70">{meme.description}</p>
            )}

            {meme.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {meme.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60"
                  >
                    <Tag size={11} /> {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/5 px-2 py-3">
                <p className="text-lg font-bold text-rose-300">{meme.likes}</p>
                <p className="text-[11px] uppercase tracking-wide text-white/40">Likes</p>
              </div>
              <div className="rounded-xl bg-white/5 px-2 py-3">
                <p className="text-lg font-bold text-emerald-300">{meme.downloads}</p>
                <p className="text-[11px] uppercase tracking-wide text-white/40">Downloads</p>
              </div>
              <div className="rounded-xl bg-white/5 px-2 py-3">
                <p className="text-lg font-bold text-amber-300">
                  {meme.is_template ? 'Yes' : 'No'}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-white/40">Template</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 border-t border-white/10 p-4">
            <button
              onClick={onLike}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/15 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/25 active:scale-95"
            >
              <Heart size={18} /> Like
            </button>
            <button
              onClick={onShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500/15 px-4 py-3 font-bold text-sky-300 transition hover:bg-sky-500/25 active:scale-95"
            >
              <Share2 size={18} /> <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={onDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 font-bold text-emerald-300 transition hover:bg-emerald-500/25 active:scale-95"
            >
              <Download size={18} /> <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
