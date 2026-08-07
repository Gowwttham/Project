import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Calendar, Image as ImageIcon, Loader2, Edit3, Check, X } from 'lucide-react';
import { supabase, type Profile, type Meme } from '@/lib/supabase';
import MemeCard from '@/components/MemeCard';

type Props = {
  userId: string;
  onBack: () => void;
  onOpenMeme: (meme: Meme) => void;
  onLike: (meme: Meme) => void;
  onShare: (meme: Meme) => void;
  onDownload: (meme: Meme) => void;
  isOwner: boolean;
};

export default function ProfilePage({
  userId,
  onBack,
  onOpenMeme,
  onLike,
  onShare,
  onDownload,
  isOwner,
}: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profErr || cancelled) return;
      if (prof) {
        setProfile(prof as Profile);
        setEditUsername((prof as Profile).username);
        setEditBio((prof as Profile).bio ?? '');
        setEditAvatar((prof as Profile).avatar_url ?? '');
      }

      const { data: userMemes } = await supabase
        .from('memes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(60);

      if (cancelled) return;
      const list = (userMemes as Meme[]) ?? [];
      setMemes(list);
      setTotalDownloads(list.reduce((sum, m) => sum + (m.downloads || 0), 0));
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const saveProfile = async () => {
    if (!profile) return;
    setEditError('');
    if (!editUsername.trim()) {
      setEditError('Username cannot be empty.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: editUsername.trim(),
        bio: editBio.trim() || null,
        avatar_url: editAvatar.trim() || null,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      if (error.code === '23505') {
        setEditError('That username is taken.');
      } else {
        setEditError(error.message);
      }
      return;
    }
    setProfile({
      ...profile,
      username: editUsername.trim(),
      bio: editBio.trim() || null,
      avatar_url: editAvatar.trim() || null,
    });
    setEditing(false);
  };

  const joinDate = profile
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  const avatarLetter = (profile?.username ?? '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Back bar */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0d12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-sm font-semibold text-white/50">Profile</span>
        </div>
      </div>

      {loading ? (
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <Loader2 size={28} className="mx-auto animate-spin text-white/30" />
        </div>
      ) : !profile ? (
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <p className="text-lg font-semibold text-white/70">Profile not found</p>
          <p className="mt-1 text-sm text-white/40">This user may not exist anymore.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {/* Profile header card */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02]">
            <div className="h-28 bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-amber-500/10 sm:h-36" />
            <div className="px-5 pb-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  {/* Avatar */}
                  <div className="-mt-12 shrink-0 sm:-mt-16">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="h-24 w-24 rounded-2xl border-4 border-[#0b0d12] object-cover sm:h-32 sm:w-32"
                      />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-[#0b0d12] bg-gradient-to-br from-amber-400 to-rose-500 text-4xl font-black text-black sm:h-32 sm:w-32">
                        {avatarLetter}
                      </div>
                    )}
                  </div>

                  <div className="pb-1">
                    {editing ? (
                      <input
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="Username"
                        className="rounded-lg border border-white/15 bg-[#0f0c08] px-3 py-1.5 text-xl font-extrabold text-white outline-none focus:border-amber-400/60"
                      />
                    ) : (
                      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                        {profile.username}
                      </h1>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} /> Joined {joinDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit / save controls */}
                <div className="shrink-0">
                  {isOwner && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <Edit3 size={15} /> Edit profile
                    </button>
                  )}
                  {isOwner && editing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-60"
                      >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditError('');
                          setEditUsername(profile.username);
                          setEditBio(profile.bio ?? '');
                          setEditAvatar(profile.avatar_url ?? '');
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        <X size={15} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-4 max-w-2xl">
                {editing ? (
                  <>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell people about yourself…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#0f0c08] px-4 py-2.5 text-sm text-white/80 outline-none placeholder:text-white/25 focus:border-amber-400/50"
                    />
                    <input
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="Avatar image URL (optional)"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0c08] px-4 py-2.5 text-sm text-white/80 outline-none placeholder:text-white/25 focus:border-amber-400/50"
                    />
                    {editError && (
                      <p className="mt-2 rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                        {editError}
                      </p>
                    )}
                  </>
                ) : (
                  profile.bio && (
                    <p className="text-sm leading-relaxed text-white/60">{profile.bio}</p>
                  )
                )}
              </div>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none">{memes.length}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Templates
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Download size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none">{totalDownloads}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Downloads
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Templates grid */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-white/80">
              {isOwner ? 'Your templates' : 'Templates'}
            </h2>
            {memes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-white/25">
                  <ImageIcon size={26} />
                </div>
                <p className="mt-4 text-sm font-semibold text-white/50">
                  {isOwner ? 'You haven\'t uploaded any templates yet.' : 'No templates uploaded yet.'}
                </p>
              </div>
            ) : (
              <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [column-fill:_balance]">
                {memes.map((meme) => (
                  <div key={meme.id} className="mb-4 break-inside-avoid">
                    <MemeCard
                      meme={meme}
                      onOpen={() => onOpenMeme(meme)}
                      onLike={() => onLike(meme)}
                      onShare={() => onShare(meme)}
                      onDownload={() => onDownload(meme)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
