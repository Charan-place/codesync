import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { useAuthStore } from '../store/authStore';
import type { Participant, ChatMessage, RoomFile } from '../types';

export function useRoomSocket(slug: string) {
  const { user, token } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [self, setSelf] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<RoomFile[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);

  const docRef = useRef<Y.Doc>(new Y.Doc());
  const awarenessRef = useRef<Awareness>(new Awareness(docRef.current));
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    const doc = docRef.current;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const guestName = user?.name || `Guest-${Math.floor(Math.random() * 1000)}`;
    socket.emit('room:join', { slug, name: guestName, token });

    socket.on('room:error', ({ error }: { error: string }) => setJoinError(error));

    socket.on('room:sync', (payload: { update: number[]; participants: Participant[]; self: Participant; files: RoomFile[] }) => {
      Y.applyUpdate(doc, new Uint8Array(payload.update), 'remote');
      setParticipants(payload.participants);
      setSelf(payload.self);
      setFiles(payload.files);
      awarenessRef.current.setLocalState({
        name: payload.self.name,
        color: payload.self.color,
      });
    });

    socket.on('doc:update', ({ update }: { update: number[] }) => {
      Y.applyUpdate(doc, new Uint8Array(update), 'remote');
    });

    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return;
      socket.emit('doc:update', { slug, update: Array.from(update) });
    };
    doc.on('update', onDocUpdate);

    socket.on('presence:join', (p: Participant) => setParticipants((prev) => [...prev.filter((x) => x.socketId !== p.socketId), p]));
    socket.on('presence:leave', ({ socketId }: { socketId: string }) =>
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId))
    );
    socket.on('presence:update', (p: Participant) =>
      setParticipants((prev) => prev.map((x) => (x.socketId === p.socketId ? p : x)))
    );
    socket.on('chat:message', (msg: ChatMessage) => setMessages((prev) => [...prev, msg]));

    return () => {
      doc.off('update', onDocUpdate);
      socket.disconnect();
      doc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function sendChat(text: string) {
    socketRef.current?.emit('chat:message', { slug, text });
  }

  function changeRole(targetSocketId: string, role: Participant['role']) {
    socketRef.current?.emit('role:change', { slug, targetSocketId, role });
  }

  return {
    connected,
    participants,
    self,
    messages,
    files,
    joinError,
    sendChat,
    changeRole,
    doc: docRef.current,
    awareness: awarenessRef.current,
    socket: socketRef.current,
  };
}
