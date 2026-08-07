import { useState } from 'react';
import { Shield, X } from 'lucide-react';

const DEV_PASSWORD = 'NAAORUGAY';

export default function DeveloperGateModal({
  onClose,
  onUnlock,
}: {
  onClose: () => void;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === DEV_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#11141b] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 transition hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-black">
          <Shield size={24} strokeWidth={2.5} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">Developer access</h2>
        <p className="mt-1 text-sm text-white/50">
          Enter the developer password to access the approval panel.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            autoFocus
            placeholder="Developer password"
            className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition ${
              error ? 'border-rose-500' : 'border-white/10 focus:border-emerald-400/60'
            }`}
          />
          {error && (
            <p className="text-xs font-medium text-rose-400">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-3 text-sm font-bold text-black transition hover:scale-[1.02] active:scale-95"
          >
            Unlock developer mode
          </button>
        </form>
      </div>
    </div>
  );
}
