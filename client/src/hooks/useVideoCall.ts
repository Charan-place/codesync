import { useEffect, useRef, useState } from 'react';
// @ts-ignore - simple-peer ships CJS types that resolve loosely under bundlers
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';

export function useVideoCall(socket: Socket | null, slug: string, inCall: boolean) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const peersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!socket || !inCall) return;
    let stream: MediaStream | undefined;
    let cancelled = false;

    function cleanupPeer(id: string) {
      peersRef.current[id]?.destroy();
      delete peersRef.current[id];
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }

    function createPeer(targetSocketId: string, initiator: boolean) {
      const peer = new Peer({ initiator, trickle: true, stream });
      peer.on('signal', (signal: unknown) => socket!.emit('webrtc:signal', { slug, targetSocketId, signal }));
      peer.on('stream', (remoteStream: MediaStream) =>
        setRemoteStreams((prev) => ({ ...prev, [targetSocketId]: remoteStream }))
      );
      peer.on('close', () => cleanupPeer(targetSocketId));
      peer.on('error', () => cleanupPeer(targetSocketId));
      peersRef.current[targetSocketId] = peer;
      return peer;
    }

    const onPeerJoined = ({ socketId }: { socketId: string }) => {
      if (!stream) return;
      createPeer(socketId, true);
    };
    const onSignal = ({ fromSocketId, signal }: { fromSocketId: string; signal: any }) => {
      let peer = peersRef.current[fromSocketId];
      if (!peer) peer = createPeer(fromSocketId, false);
      peer.signal(signal);
    };
    const onPeerLeft = ({ socketId }: { socketId: string }) => cleanupPeer(socketId);

    socket.on('webrtc:peer-joined', onPeerJoined);
    socket.on('webrtc:signal', onSignal);
    socket.on('webrtc:peer-left', onPeerLeft);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        setLocalStream(s);
        socket.emit('webrtc:join-call', { slug });
      })
      .catch((err) => setMediaError(err.message || 'Could not access camera/microphone'));

    return () => {
      cancelled = true;
      socket.off('webrtc:peer-joined', onPeerJoined);
      socket.off('webrtc:signal', onSignal);
      socket.off('webrtc:peer-left', onPeerLeft);
      socket.emit('webrtc:leave-call', { slug });
      Object.keys(peersRef.current).forEach(cleanupPeer);
      stream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setRemoteStreams({});
    };
  }, [socket, inCall, slug]);

  return { localStream, remoteStreams, mediaError };
}
