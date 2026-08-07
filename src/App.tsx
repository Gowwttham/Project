import { useEffect, useMemo, useState, useCallback } from 'react';
import { Flame, TrendingUp, Upload, Search, HelpCircle, Lock, Bell, Shield, LogOut, User as UserIcon } from 'lucide-react';
import { supabase, type Meme, type UploadRequest } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import MemeCard from '@/components/MemeCard';
import UploadModal from '@/components/UploadModal';
import MemeModal from '@/components/MemeModal';
import HelpModal from '@/components/HelpModal';
import OnlyFansModal from '@/components/OnlyFansModal';
import DeveloperGateModal from '@/components/DeveloperGateModal';
import NotificationsModal from '@/components/NotificationsModal';
import AuthModal from '@/components/AuthModal';
import ProfilePage from '@/components/ProfilePage';

type Tab = 'trending' | 'new' | 'onlyfans';

export default function App() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('trending');
  const [query, setQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [active, setActive] = useState<Meme | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [onlyFansLocked, setOnlyFansLocked] = useState(true);
  const [onlyFansPromptOpen, setOnlyFansPromptOpen] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [devGateOpen, setDevGateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | 'upload' | 'download'>(null);
  const [pendingDownloadMeme, setPendingDownloadMeme] = useState<Meme | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const loadMemes = async () => {
    setLoading(true);
    let q = supabase.from('memes').select('*');
    if (tab === 'trending') q = q.order('likes', { ascending: false });
    else if (tab === 'new') q = q.order('created_at', { ascending: false });
    else if (tab === 'onlyfans') q = q.eq('category', 'onlyfans').order('created_at', { ascending: false });
    const { data, error } = await q.limit(60);
    if (error) {
      console.error(error);
      setMemes([]);
    } else {
      setMemes(data as Meme[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMemes();
  }, [tab]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshPending = useCallback(async () => {
    const { count, error } = await supabase
      .from('upload_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (!error && count !== null) setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshPending();
    const interval = setInterval(refreshPending, 15000);
    return () => clearInterval(interval);
  }, [refreshPending]);

  const filtered = useMemo(() => {
    if (!query.trim()) return memes;
    const q = query.toLowerCase();
    return memes.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [memes, query]);

  const handleLike = async (meme: Meme) => {
    const { data } = await supabase
      .from('memes')
      .update({ likes: meme.likes + 1 })
      .eq('id', meme.id)
      .select('likes')
      .single();
    const newLikes = data?.likes ?? meme.likes + 1;
    setMemes((prev) => prev.map((m) => (m.id === meme.id ? { ...m, likes: newLikes } : m)));
    if (active?.id === meme.id) setActive((p) => (p ? { ...p, likes: newLikes } : p));
  };

  const handleDownload = async (meme: Meme) => {
    if (!session) {
      setPendingDownloadMeme(meme);
      setPendingAction('download');
      setAuthOpen(true);
      return;
    }
    await supabase.from('memes').update({ downloads: meme.downloads + 1 }).eq('id', meme.id);
    setMemes((prev) => prev.map((m) => (m.id === meme.id ? { ...m, downloads: m.downloads + 1 } : m)));
    const a = document.createElement('a');
    a.href = meme.media_url;
    a.download = `${meme.title.replace(/\s+/g, '_')}.${meme.media_type === 'video' ? 'mp4' : 'jpg'}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const requireUpload = () => {
    if (!session) {
      setPendingAction('upload');
      setAuthOpen(true);
      return false;
    }
    return true;
  };

  const handleShare = async (meme: Meme) => {
    const url = meme.media_url;
    if (navigator.share) {
      try {
        await navigator.share({ title: meme.title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (profileUserId) {
    return (
      <ProfilePage
        userId={profileUserId}
        isOwner={session?.user.id === profileUserId}
        onBack={() => setProfileUserId(null)}
        onOpenMeme={(m) => setActive(m)}
        onLike={handleLike}
        onShare={handleShare}
        onDownload={handleDownload}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0d12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-black">
              <Flame size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Meme<span className="text-amber-400">Nadu</span>
            </span>
          </div>

          <div className="relative ml-auto hidden flex-1 max-w-md sm:block">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memes, tags…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400/60 focus:bg-white/10"
            />
          </div>

          <button
            onClick={() => setHelpOpen(true)}
            aria-label="Help / Wishes"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white sm:ml-auto"
          >
            <HelpCircle size={18} />
          </button>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Account"
              >
                <UserIcon size={18} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#12151c] p-2 shadow-2xl">
                    <p className="truncate px-3 py-2 text-xs text-white/50">
                      {session.user.email}
                    </p>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setProfileUserId(session.user.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                    >
                      <UserIcon size={15} /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        supabase.auth.signOut();
                        setUserMenuOpen(false);
                        setIsDeveloper(false);
                        setProfileUserId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setPendingAction(null); setAuthOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <UserIcon size={15} /> <span className="hidden sm:inline">Sign in</span>
            </button>
          )}

          {isDeveloper && (
            <button
              onClick={() => setNotificationsOpen(true)}
              aria-label="Upload approvals"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Bell size={18} />
              {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          )}

          {!isDeveloper && (
            <button
              onClick={() => setDevGateOpen(true)}
              aria-label="Developer access"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white/70"
              title="Developer access"
            >
              <Shield size={16} />
            </button>
          )}

          <button
            onClick={() => {
              if (requireUpload()) setUploadOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-2 text-sm font-bold text-black transition hover:scale-105 active:scale-95"
          >
            <Upload size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_0%,rgba(251,191,36,0.18),transparent_60%)]" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-600/20 blur-3xl" />
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-amber-300">
            <Flame size={14} /> The dankest corner of the internet
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Vanakkam koothi's.
            <span className="bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">
              {' '}Memes paathu enjoy pannuga santhosama ponga.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/60 sm:text-lg">
            Vanakam makku koothi's. Intha meme site run panradhu oru tamilan. Athunala tamil
            templates thaa most irukum. If you needed any template kindly say it in the help box.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                if (requireUpload()) setUploadOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-6 py-3 font-bold text-black transition hover:scale-105 active:scale-95"
            >
              <Upload size={18} strokeWidth={2.5} /> Upload a meme
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[57px] z-30 border-b border-white/10 bg-[#0b0d12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          {([
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'new', label: 'New', icon: Flame },
            { id: 'onlyfans', label: 'OnlyFans', icon: Lock },
          ] as const).map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === 'onlyfans' && onlyFansLocked) {
                    setOnlyFansPromptOpen(true);
                    return;
                  }
                  setTab(t.id);
                }}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  on
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        {loading ? (
          <div className="columns-2 gap-5 sm:columns-3 lg:columns-4 [column-fill:_balance]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="mb-5 break-inside-avoid animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]"
                style={{ height: `${180 + ((i * 47) % 220)}px` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-white/30">
              <Flame size={28} />
            </div>
            <p className="mt-4 text-lg font-semibold">No memes here yet</p>
            <p className="mt-1 text-sm text-white/50">
              Be the first to upload one — the world needs your content.
            </p>
            <button
              onClick={() => {
                if (requireUpload()) setUploadOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-5 py-2.5 font-bold text-black transition hover:scale-105"
            >
              <Upload size={16} /> Upload now
            </button>
          </div>
        ) : (
          <div className="columns-2 gap-5 sm:columns-3 lg:columns-4 [column-fill:_balance]">
            {filtered.map((meme) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                onOpen={() => setActive(meme)}
                onLike={() => handleLike(meme)}
                onShare={() => handleShare(meme)}
                onDownload={() => handleDownload(meme)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/40 sm:px-6">
MemeNadu — built for the culture. Upload responsibly.
      </footer>

      {authOpen && (
        <AuthModal
          onClose={() => {
            setAuthOpen(false);
            setPendingAction(null);
            setPendingDownloadMeme(null);
          }}
          pendingAction={pendingAction}
          onSuccess={() => {
            setAuthOpen(false);
            if (pendingAction === 'upload') {
              setUploadOpen(true);
            } else if (pendingAction === 'download' && pendingDownloadMeme) {
              handleDownload(pendingDownloadMeme);
            }
            setPendingAction(null);
            setPendingDownloadMeme(null);
          }}
        />
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            setUploadOpen(false);
            setTab('new');
            loadMemes();
            refreshPending();
          }}
          onlyFansUnlocked={!onlyFansLocked}
          isDeveloper={isDeveloper}
          session={session}
        />
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {onlyFansPromptOpen && (
        <OnlyFansModal
          onClose={() => setOnlyFansPromptOpen(false)}
          onUnlock={() => {
            setOnlyFansLocked(false);
            setOnlyFansPromptOpen(false);
            setTab('onlyfans');
          }}
        />
      )}

      {devGateOpen && (
        <DeveloperGateModal
          onClose={() => setDevGateOpen(false)}
          onUnlock={() => {
            setIsDeveloper(true);
            setDevGateOpen(false);
            refreshPending();
          }}
        />
      )}

      {notificationsOpen && (
        <NotificationsModal
          onClose={() => setNotificationsOpen(false)}
          onCountChange={setPendingCount}
        />
      )}

      {active && (
        <MemeModal
          meme={active}
          onClose={() => setActive(null)}
          onLike={() => handleLike(active)}
          onShare={() => handleShare(active)}
          onDownload={() => handleDownload(active)}
        />
      )}
    </div>
  );
}
