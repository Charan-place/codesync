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
    <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-slate-800">
      {participants.map((p) => (
        <div key={p.socketId} className="flex items-center gap-1.5 rounded-full bg-slate-900 pl-1 pr-2 py-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}{p.socketId === self?.socketId ? ' (you)' : ''}</span>
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
        </div>
      ))}
    </div>
  );
}
