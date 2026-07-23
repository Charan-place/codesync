import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function VideoTile({ stream, muted, label }: { stream: MediaStream; muted?: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-lg overflow-hidden bg-black aspect-video ring-1 ring-white/10"
    >
      <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
        {label}
      </span>
    </motion.div>
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
    <div className="border-b border-slate-800 p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Video call</span>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onToggle}
          className={`text-xs font-medium rounded-full px-3 py-1 transition-colors ${
            inCall ? 'bg-red-600/90 hover:bg-red-500' : 'bg-brand-600 hover:bg-brand-500'
          }`}
        >
          {inCall ? 'Leave call' : 'Join call'}
        </motion.button>
      </div>
      {mediaError && <p className="text-xs text-red-400 mb-2">{mediaError}</p>}
      <AnimatePresence>
        {inCall && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-1.5 overflow-hidden"
          >
            {localStream && <VideoTile stream={localStream} muted label="You" />}
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <VideoTile key={id} stream={stream} label="Peer" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
