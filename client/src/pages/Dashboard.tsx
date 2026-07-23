import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { myRooms, createRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import type { Room } from '../types';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    myRooms()
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoadingRooms(false));
  }, [user, navigate]);

  async function handleNewRoom() {
    setCreating(true);
    try {
      const room = await createRoom({ title: 'Untitled room' });
      navigate(`/room/${room.slug}`);
    } catch {
      toast.error("Couldn't create a room. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[120px]" />
      </div>

      <header className="glass sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline text-slate-400">{user?.email}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              toast.success('Logged out.');
              navigate('/');
            }}
            className="text-slate-300 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your rooms</h1>
            <p className="mt-1 text-sm text-slate-400">Jump back into a session or start something new.</p>
          </div>
          <Button onClick={handleNewRoom} loading={creating}>
            {creating ? 'Creating…' : '+ New room'}
          </Button>
        </motion.div>

        {loadingRooms ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">No rooms yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first room to start pairing.</p>
            <Button onClick={handleNewRoom} loading={creating} className="mt-5" size="sm">
              + New room
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rooms.map((room, i) => (
              <motion.a
                key={room.slug}
                href={`/room/${room.slug}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: easeOut }}
                whileHover={{ y: -3 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06] hover:border-white/15"
              >
                <div className="flex items-start justify-between">
                  <p className="font-medium text-slate-100 group-hover:text-white">{room.title}</p>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{room.visibility}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">/{room.slug}</p>
                <p className="mt-4 text-xs text-slate-600">{new Date(room.createdAt).toLocaleDateString()}</p>
              </motion.a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
