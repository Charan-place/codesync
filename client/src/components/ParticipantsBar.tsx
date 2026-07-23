import { motion, AnimatePresence } from 'framer-motion';
import type { Participant } from '../types';

export default function ParticipantsBar({
  participants,
  self,
  onChangeRole,
}: {
  participants: Participant[];
  self: Participant | null;
  onChangeRole: (socketId: string, role: Participant['role']) => void;
}) {
  const isHost = self?.role === 'host';
  return (
    <div className="flex items-center gap-2 flex-wrap px-3 py-2.5 border-b border-slate-800">
      <AnimatePresence initial={false}>
        {participants.map((p) => (
          <motion.div
            key={p.socketId}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 pl-1.5 pr-2.5 py-1 text-xs"
          >
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white/10"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-slate-200">
              {p.name}
              {p.socketId === self?.socketId ? ' (you)' : ''}
            </span>
            {isHost && p.socketId !== self?.socketId ? (
              <select
                value={p.role}
                onChange={(e) => onChangeRole(p.socketId, e.target.value as Participant['role'])}
                className="bg-transparent text-slate-400 text-[11px] focus:outline-none"
              >
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
                <option value="host">host</option>
              </select>
            ) : (
              <span className="text-slate-500">{p.role}</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
