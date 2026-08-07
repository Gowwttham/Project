import { useState } from 'react';
import { X, Mail, Lock, Loader2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  pendingAction?: 'upload' | 'download' | null;
};

export default function AuthModal({ onClose, onSuccess, pendingAction }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong.';
      if (msg.toLowerCase().includes('already registered')) {
        setError('That email is already registered. Try signing in instead.');
      } else if (msg.toLowerCase().includes('invalid login')) {
        setError('Invalid email or password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#12151c] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-7 pb-2">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-black">
            {mode === 'signin' ? <Lock size={22} strokeWidth={2.5} /> : <User size={22} strokeWidth={2.5} />}
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-white">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h2>
          <p className="mt-1 text-sm text-white/50">
            {pendingAction === 'upload'
              ? 'You need to be signed in to upload a meme.'
              : pendingAction === 'download'
                ? 'You need to be signed in to download a meme.'
                : 'Sign in to upload and download memes.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mx-6 mt-5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`rounded-lg py-2 text-sm font-bold transition ${
                mode === m ? 'bg-orange-500 text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3 px-6 pb-7 pt-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/40">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-[#0c0e12] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/40">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-white/10 bg-[#0c0e12] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/50"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-base font-bold text-black transition hover:bg-orange-400 active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : mode === 'signin' ? (
              'Sign in & continue'
            ) : (
              'Create account & continue'
            )}
          </button>

          <p className="pt-1 text-center text-xs text-white/40">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="font-bold text-orange-400 hover:text-orange-300"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
