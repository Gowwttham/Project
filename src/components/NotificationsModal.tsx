import { useEffect, useState } from 'react';
import { Bell, X, Check, Trash2, Loader2, Image as ImageIcon, Film, Sparkles } from 'lucide-react';
import { supabase, type UploadRequest } from '@/lib/supabase';

export default function NotificationsModal({
  onClose,
  onCountChange,
}: {
  onClose: () => void;
  onCountChange: (n: number) => void;
}) {
  const [requests, setRequests] = useState<UploadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('upload_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      setRequests([]);
    } else {
      setRequests(data as UploadRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    onCountChange(requests.length);
  }, [requests, onCountChange]);

  const approve = async (r: UploadRequest) => {
    setBusyId(r.id);
    const { error: insErr } = await supabase.from('memes').insert({
      title: r.title,
      description: r.description,
      media_url: r.media_url,
      media_type: r.media_type,
      tags: r.tags,
      category: r.category,
    });
    if (insErr) {
      console.error(insErr);
      setBusyId(null);
      return;
    }
    await supabase.from('upload_requests').update({ status: 'approved' }).eq('id', r.id);
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
    setBusyId(null);
  };

  const reject = async (r: UploadRequest) => {
    setBusyId(r.id);
    const { error } = await supabase
      .from('upload_requests')
      .update({ status: 'rejected' })
      .eq('id', r.id);
    if (error) console.error(error);
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
    setBusyId(null);
  };

  const TypeIcon =
    requests.find((r) => r.media_type === 'video')
      ? Film
      : requests.find((r) => r.media_type === 'gif')
        ? Sparkles
        : ImageIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#12151c] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Bell size={20} className="text-amber-400" /> Upload approvals
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-white/30">
                <Bell size={26} />
              </div>
              <p className="mt-4 font-semibold">All caught up</p>
              <p className="mt-1 text-sm text-white/50">No pending uploads to review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => {
                const Icon =
                  r.media_type === 'video' ? Film : r.media_type === 'gif' ? Sparkles : ImageIcon;
                return (
                  <div
                    key={r.id}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/30">
                      {r.media_type === 'video' ? (
                        <video
                          src={r.media_url}
                          muted
                          loop
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={r.media_url}
                          alt={r.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="truncate text-sm font-bold text-white">{r.title}</p>
                        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
                          <Icon size={11} /> {r.media_type}
                        </span>
                      </div>
                      {r.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/50">
                          {r.description}
                        </p>
                      )}
                      {r.tags.length > 0 && (
                        <p className="mt-1 truncate text-[11px] text-white/40">
                          {r.tags.join(', ')}
                        </p>
                      )}
                      {r.category && (
                        <span className="mt-1 inline-block rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                          {r.category}
                        </span>
                      )}

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => approve(r)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          {busyId === r.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => reject(r)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
