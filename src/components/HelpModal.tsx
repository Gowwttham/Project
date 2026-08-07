import { useState } from 'react';
import { X, Send, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Props = {
  onClose: () => void;
};

export default function HelpModal({ onClose }: Props) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase
      .from('wishes')
      .insert({ message: message.trim() });
    setSubmitting(false);
    if (insertError) {
      setError('Something went wrong. Please try again.');
      return;
    }
    setSubmitted(true);
    setMessage('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#14161d] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Help / Wishes</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={28} />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              Your wish has been sent!
            </p>
            <p className="mt-1 text-sm text-white/50">
              The developer will see your request. Thanks for sharing.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-6 py-2.5 text-sm font-bold text-black transition hover:scale-105"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/60">
              Got a template request or a wish for the site? Type it below — it goes
              straight to the developer.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your wish or template request here…"
              rows={5}
              maxLength={1000}
              className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/30 outline-none transition focus:border-amber-400/60 focus:bg-white/10"
            />
            <div className="mt-1 text-right text-xs text-white/30">
              {message.length}/1000
            </div>
            {error && (
              <p className="mt-2 text-sm text-rose-400">{error}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-6 py-3 font-bold text-black transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} strokeWidth={2.5} />
              {submitting ? 'Sending…' : 'Send wish'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
