import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

const FEATURES = [
  {
    title: 'Live collaborative editor',
    desc: 'Every keystroke syncs instantly via CRDTs — no merge conflicts, no lag, no lost edits.',
    icon: (
      <path d="M4 17l6-6-6-6M12 19h8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Face-to-face video calling',
    desc: 'Jump on a call without leaving the room — built-in, peer-to-peer, zero setup.',
    icon: (
      <path
        d="M15 10l5-3v10l-5-3M4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Real-time chat & presence',
    desc: 'See who is here, what they are doing, and talk it through without switching apps.',
    icon: (
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const room = await createRoom({ title: 'Untitled room' });
      navigate(`/room/${room.slug}`);
    } catch {
      toast.error("Couldn't create a room. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient glow background, Apple-marketing-page style */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[120px]" />
        <div className="absolute right-[-10%] top-[30%] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[110px]" />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="glass sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-white/5"
      >
        <Logo />
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          ) : (
            <>
              <button type="button" onClick={() => navigate('/login')} className="text-slate-300 hover:text-white transition-colors px-2">
                Log in
              </button>
              <Button size="sm" onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </>
          )}
        </nav>
      </motion.header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live now — real-time everything
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: easeOut }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight max-w-3xl text-gradient leading-[1.05]"
        >
          Share code in real-time,
          <br />
          without the friction.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: easeOut }}
          className="mt-6 text-slate-400 max-w-xl text-lg leading-relaxed"
        >
          Instant collaborative editor, live cursors, chat and video calling — built for
          interviews, pairing and teaching. No install, no setup.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.36, ease: easeOut }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <Button size="lg" loading={loading} onClick={handleStart}>
            {loading ? 'Creating room…' : 'Start sharing — it’s free'}
          </Button>
          <p className="text-xs text-slate-500">No sign-up required for a quick session.</p>
        </motion.div>
      </main>

      <section className="px-6 pb-28 pt-4">
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: easeOut }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition-colors hover:bg-white/[0.05] hover:border-white/15"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-slate-600">
        Built for pairing, interviews and teaching — no install, no setup.
      </footer>
    </div>
  );
}
