import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { myRooms, createRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import type { Room } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    myRooms().then(setRooms).catch(() => {});
  }, [user, navigate]);

  async function handleNewRoom() {
    setCreating(true);
    try {
      const room = await createRoom({ title: 'Untitled room' });
      navigate(`/room/${room.slug}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <span className="text-lg font-semibold">CodeSync</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">{user?.email}</span>
          <button onClick={() => { logout(); navigate('/'); }} className="text-slate-300 hover:text-white">Log out</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Your rooms</h1>
          <button onClick={handleNewRoom} disabled={creating} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60">
            {creating ? 'Creating…' : '+ New room'}
          </button>
        </div>

        {rooms.length === 0 ? (
          <p className="text-slate-500 text-sm">No rooms yet — create one to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
            {rooms.map((room) => (
              <li key={room.slug}>
                <a href={`/room/${room.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-900">
                  <div>
                    <p className="font-medium">{room.title}</p>
                    <p className="text-xs text-slate-500">/{room.slug} · {room.visibility}</p>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(room.createdAt).toLocaleDateString()}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
