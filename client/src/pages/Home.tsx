import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const room = await createRoom({ title: 'Untitled room' });
      navigate(`/room/${room.slug}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <span className="text-lg font-semibold tracking-tight">CodeSync</span>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <a href="/dashboard" className="text-slate-300 hover:text-white">Dashboard</a>
          ) : (
            <>
              <a href="/login" className="text-slate-300 hover:text-white">Log in</a>
              <a href="/signup" className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">Sign up</a>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
          Share code in real-time, without the friction.
        </h1>
        <p className="mt-4 text-slate-400 max-w-xl">
          Instant collaborative editor, live cursors, chat and video calling — built for
          interviews, pairing and teaching. No install, no setup.
        </p>
        <button
          onClick={handleStart}
          disabled={loading}
          className="mt-8 rounded-lg bg-brand-600 px-6 py-3 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? 'Creating room…' : 'Start sharing — it’s free'}
        </button>
        <p className="mt-3 text-xs text-slate-500">No sign-up required for a quick session.</p>
      </main>
    </div>
  );
}
