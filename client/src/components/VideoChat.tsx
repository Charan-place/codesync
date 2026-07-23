import { useEffect, useRef } from 'react';

function VideoTile({ stream, muted, label }: { stream: MediaStream; muted?: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative rounded-md overflow-hidden bg-black aspect-video">
      <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded">{label}</span>
    </div>
  );
}

export default function VideoChat({
  inCall,
  onToggle,
  localStream,
  remoteStreams,
  mediaError,
}: {
  inCall: boolean;
  onToggle: () => void;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  mediaError: string | null;
}) {
  return (
    <div className="border-b border-slate-800 p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Video call</span>
        <button
          onClick={onToggle}
          className={`text-xs rounded-md px-2 py-1 ${inCall ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
        >
          {inCall ? 'Leave call' : 'Join call'}
        </button>
      </div>
      {mediaError && <p className="text-xs text-red-400 mb-2">{mediaError}</p>}
      {inCall && (
        <div className="grid grid-cols-2 gap-1.5">
          {localStream && <VideoTile stream={localStream} muted label="You" />}
          {Object.entries(remoteStreams).map(([id, stream]) => (
            <VideoTile key={id} stream={stream} label="Peer" />
          ))}
        </div>
      )}
    </div>
  );
}
