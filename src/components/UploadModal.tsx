import { useRef, useState } from 'react';
import {
  X,
  UploadCloud,
  Loader2,
  ImagePlus,
  Check,
  Lock,
} from 'lucide-react';
import { supabase, MEMES_BUCKET, type Meme } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type Props = {
  onClose: () => void;
  onUploaded: () => void;
  onlyFansUnlocked: boolean;
  isDeveloper: boolean;
  session: Session | null;
};

type Stage = 'idle' | 'uploading' | 'done';

const ONLYFANS_SECRET = 'NAAORUGAY';

const CATEGORIES = ['General', 'Trending', 'New', 'OnlyFans'];

export default function UploadModal({ onClose, onUploaded, onlyFansUnlocked, isDeveloper, session }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<Meme['media_type']>('image');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [ofPassword, setOfPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectType = (f: File): Meme['media_type'] => {
    if (f.type.startsWith('video')) return 'video';
    if (f.name.toLowerCase().endsWith('.gif') || f.type === 'image/gif') return 'gif';
    return 'image';
  };

  const handleFile = (f: File) => {
    setFile(f);
    setMediaType(detectType(f));
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const isOnlyFans = category === 'OnlyFans';

  const submit = async () => {
    if (!file) { setError('Please select a file.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (isOnlyFans && ofPassword !== ONLYFANS_SECRET) {
      setError('Incorrect OnlyFans password.');
      return;
    }

    setError('');
    setStage('uploading');

    const ext = file.name.split('.').pop() || 'bin';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(MEMES_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (upErr) {
      setError(upErr.message);
      setStage('idle');
      return;
    }

    const { data: pub } = supabase.storage.from(MEMES_BUCKET).getPublicUrl(path);
    const mediaUrl = pub.publicUrl;

    const dbCategory = isOnlyFans ? 'onlyfans' : null;

    if (isDeveloper) {
      const { error: insErr } = await supabase.from('memes').insert({
        title: title.trim(),
        description: handle.trim() ? `Submitted by: ${handle.trim()}` : null,
        media_url: mediaUrl,
        media_type: mediaType,
        tags: [],
        category: dbCategory,
        user_id: session?.user.id ?? null,
      });
      if (insErr) { setError(insErr.message); setStage('idle'); return; }
    } else {
      const { error: reqErr } = await supabase.from('upload_requests').insert({
        title: title.trim(),
        description: handle.trim() ? `Submitted by: ${handle.trim()}` : null,
        media_url: mediaUrl,
        media_type: mediaType,
        tags: [],
        category: dbCategory,
        status: 'pending',
        user_id: session?.user.id ?? null,
      });
      if (reqErr) { setError(reqErr.message); setStage('idle'); return; }
    }

    setStage('done');
    setTimeout(onUploaded, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-8 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500 text-black">
            <UploadCloud size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Submit a Meme</h1>
            <p className="mt-0.5 text-sm text-white/50">
              Upload a template from your device. The host will review and add it to the site.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {stage === 'done' ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#1a1208] py-24 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={32} strokeWidth={3} />
            </div>
            <p className="mt-5 text-xl font-bold text-white">
              {isDeveloper ? 'Meme uploaded!' : 'Sent for approval!'}
            </p>
            <p className="mt-1.5 text-sm text-white/50">
              {isDeveloper
                ? 'Taking you back to the feed…'
                : 'The developer will review your meme before it goes live.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left column — form */}
            <div className="rounded-2xl border border-white/10 bg-[#1a1208] p-5">
              {/* Drop zone */}
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">
                Upload File
              </p>
              <div
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                  dragging
                    ? 'border-orange-400 bg-orange-400/5'
                    : file
                    ? 'border-orange-500/50 bg-orange-500/5'
                    : 'border-white/20 bg-white/[0.02] hover:border-orange-400/40 hover:bg-white/[0.04]'
                }`}
              >
                <ImagePlus size={32} className={file ? 'text-orange-400' : 'text-white/30'} />
                {file ? (
                  <>
                    <p className="mt-3 max-w-xs truncate text-sm font-semibold text-white">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-orange-400/80">Click to change file</p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-semibold text-white/80">Click to select file</p>
                    <p className="mt-1 text-xs text-white/40">Images, GIFs, Videos — up to 50 MB</p>
                    <p className="mt-1 text-xs text-orange-400/70">
                      Your device's permission will be requested
                    </p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>

              {/* Title */}
              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distracted Boyfriend"
                  className="w-full rounded-xl border border-white/10 bg-[#0f0c08] px-4 py-3 font-mono text-sm text-white/80 outline-none placeholder:text-white/25 focus:border-orange-500/50"
                />
              </div>

              {/* Category */}
              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#0f0c08] px-4 py-3 text-sm text-white/80 outline-none focus:border-orange-500/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} disabled={c === 'OnlyFans' && !onlyFansUnlocked}>
                        {c}
                        {c === 'OnlyFans' && !onlyFansUnlocked ? ' (locked)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                    ▾
                  </div>
                </div>
              </div>

              {/* OnlyFans password */}
              {isOnlyFans && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-bold text-rose-400">
                    <Lock size={13} /> OnlyFans Password Required
                  </p>
                  <input
                    type="password"
                    value={ofPassword}
                    onChange={(e) => setOfPassword(e.target.value)}
                    placeholder="Enter the secret phrase..."
                    className="w-full rounded-xl border border-rose-500/20 bg-[#0f0c08] px-4 py-3 font-mono text-sm text-white/80 outline-none placeholder:text-white/25 focus:border-rose-500/50"
                  />
                </div>
              )}

              {/* Handle */}
              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">
                  Your Name / Handle
                </label>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="xX_meme_lord_Xx"
                  className="w-full rounded-xl border border-white/10 bg-[#0f0c08] px-4 py-3 font-mono text-sm text-white/80 outline-none placeholder:text-white/25 focus:border-orange-500/50"
                />
              </div>

              {error && (
                <p className="mt-3 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={submit}
                disabled={stage === 'uploading'}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-base font-bold text-black transition hover:bg-orange-400 active:scale-95 disabled:opacity-60"
              >
                {stage === 'uploading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Uploading…
                  </>
                ) : (
                  'Submit Template'
                )}
              </button>
            </div>

            {/* Right column — preview */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">
                Preview
              </p>
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1208]">
                {preview ? (
                  mediaType === 'video' ? (
                    <video
                      src={preview}
                      controls
                      muted
                      loop
                      className="max-h-[500px] w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="preview"
                      className="max-h-[500px] w-full rounded-2xl object-contain"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white/25">
                    <ImagePlus size={36} />
                    <p className="text-sm">Select a file to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
