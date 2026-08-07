import { Heart, Share2, Download, Play } from 'lucide-react';
import type { Meme } from '@/lib/supabase';

type Props = {
  meme: Meme;
  onOpen: () => void;
  onLike: () => void;
  onShare: () => void;
  onDownload: () => void;
};

export default function MemeCard({ meme, onOpen, onLike, onShare, onDownload }: Props) {
  const isVideo = meme.media_type === 'video';

  return (
    <div
      onClick={onOpen}
      className="group relative mb-5 cursor-pointer overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      {/* Media — natural aspect ratio for masonry */}
      <div className="relative w-full overflow-hidden bg-black/40">
        {isVideo ? (
          <video
            src={meme.media_url}
            className="w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
        ) : (
          <img
            src={meme.media_url}
            alt={meme.title}
            loading="lazy"
            className="w-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
        )}

        {/* Video badge */}
        {isVideo && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/0">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-black/50 backdrop-blur-md transition group-hover:scale-90 group-hover:opacity-0">
              <Play size={18} className="ml-0.5 text-white" fill="white" />
            </div>
          </div>
        )}

        {/* Template badge */}
        {meme.is_template && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg backdrop-blur-sm">
            Template
          </span>
        )}

        {/* Hover overlay with quick actions */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Floating action buttons on hover */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex translate-y-2 gap-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-rose-300 backdrop-blur-md transition hover:scale-110 hover:bg-rose-500/80 hover:text-white active:scale-90"
            title="Like"
          >
            <Heart size={16} fill="currentColor" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-sky-300 backdrop-blur-md transition hover:scale-110 hover:bg-sky-500/80 hover:text-white active:scale-90"
            title="Share"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-emerald-300 backdrop-blur-md transition hover:scale-110 hover:bg-emerald-500/80 hover:text-white active:scale-90"
            title="Download"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-4 py-3">
        <h3 className="truncate text-sm font-bold tracking-tight text-white/90">{meme.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
          <span className="inline-flex items-center gap-1 text-rose-300/80">
            <Heart size={12} fill="currentColor" /> {meme.likes}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-300/80">
            <Download size={12} /> {meme.downloads}
          </span>
          {meme.tags.length > 0 && (
            <span className="ml-auto truncate text-white/30">
              {meme.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
