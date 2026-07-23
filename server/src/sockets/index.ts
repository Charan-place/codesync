import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import Room from '../models/Room';
import ChatMessage from '../models/ChatMessage';
import { verifyToken } from '../utils/token';
import { colorForIndex } from '../utils/slug';

interface Participant {
  socketId: string;
  name: string;
  color: string;
  role: 'host' | 'editor' | 'viewer';
  userId?: string;
}

// In-memory per-process state. Fine for a single Render instance; if the
// service is ever scaled horizontally, this (and Socket.IO itself) needs a
// Redis adapter so rooms are consistent across instances.
const roomDocs = new Map<string, Y.Doc>();
const roomParticipants = new Map<string, Map<string, Participant>>();
const saveTimers = new Map<string, NodeJS.Timeout>();

function getDoc(slug: string): Y.Doc {
  let doc = roomDocs.get(slug);
  if (!doc) {
    doc = new Y.Doc();
    roomDocs.set(slug, doc);
  }
  return doc;
}

function scheduleSave(slug: string) {
  if (saveTimers.has(slug)) return;
  const timer = setTimeout(async () => {
    saveTimers.delete(slug);
    const doc = roomDocs.get(slug);
    if (!doc) return;
    try {
      const state = Buffer.from(Y.encodeStateAsUpdate(doc));
      await Room.findOneAndUpdate({ slug }, { ydocState: state, lastActiveAt: new Date() });
    } catch (err) {
      console.error(`[sockets] failed to persist room ${slug}:`, err);
    }
  }, 4000);
  saveTimers.set(slug, timer);
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoom: string | null = null;

    socket.on('room:join', async ({ slug, name, token }: { slug: string; name: string; token?: string }) => {
      const room = await Room.findOne({ slug }).select('+ydocState');
      if (!room) {
        socket.emit('room:error', { error: 'Room not found or expired' });
        return;
      }

      currentRoom = slug;
      socket.join(slug);

      let userId: string | undefined;
      if (token) {
        try {
          userId = verifyToken(token).userId;
        } catch {
          /* invalid token -> treat as guest */
        }
      }

      const doc = getDoc(slug);
      // Hydrate from Mongo on first load into memory for this room.
      if (doc.store.clients.size === 0 && room.ydocState?.length) {
        Y.applyUpdate(doc, new Uint8Array(room.ydocState));
      }

      const participants = roomParticipants.get(slug) || new Map();
      const isFirst = participants.size === 0;
      const isOwner = !!room.ownerId && String(room.ownerId) === userId;
      const participant: Participant = {
        socketId: socket.id,
        name: name || 'Guest',
        color: colorForIndex(participants.size),
        role: isFirst || isOwner ? 'host' : 'editor',
        userId,
      };
      participants.set(socket.id, participant);
      roomParticipants.set(slug, participants);

      socket.emit('room:sync', {
        update: Array.from(Y.encodeStateAsUpdate(doc)),
        participants: Array.from(participants.values()),
        self: participant,
        files: room.files,
      });

      socket.to(slug).emit('presence:join', participant);
    });

    socket.on('doc:update', ({ slug, update }: { slug: string; update: number[] }) => {
      if (!currentRoom || currentRoom !== slug) return;
      const doc = getDoc(slug);
      Y.applyUpdate(doc, new Uint8Array(update));
      socket.to(slug).emit('doc:update', { update });
      scheduleSave(slug);
    });

    socket.on('presence:cursor', ({ slug, cursor }: { slug: string; cursor: unknown }) => {
      if (!currentRoom || currentRoom !== slug) return;
      socket.to(slug).emit('presence:cursor', { socketId: socket.id, cursor });
    });

    socket.on('role:change', ({ slug, targetSocketId, role }: { slug: string; targetSocketId: string; role: Participant['role'] }) => {
      if (!currentRoom || currentRoom !== slug) return;
      const participants = roomParticipants.get(slug);
      const requester = participants?.get(socket.id);
      const target = participants?.get(targetSocketId);
      if (!participants || !requester || !target || requester.role !== 'host') return;
      target.role = role;
      io.to(slug).emit('presence:update', target);
    });

    socket.on('chat:message', async ({ slug, text }: { slug: string; text: string }) => {
      if (!currentRoom || currentRoom !== slug || !text?.trim()) return;
      const participants = roomParticipants.get(slug);
      const participant = participants?.get(socket.id);
      const room = await Room.findOne({ slug });
      if (!room) return;
      const message = await ChatMessage.create({
        roomId: room._id,
        senderName: participant?.name || 'Guest',
        senderId: participant?.userId,
        text: text.slice(0, 2000),
      });
      io.to(slug).emit('chat:message', {
        senderName: message.senderName,
        text: message.text,
        createdAt: message.createdAt,
      });
    });

    // --- WebRTC signaling relay (video/audio calling) ---
    socket.on('webrtc:signal', ({ slug, targetSocketId, signal }: { slug: string; targetSocketId: string; signal: unknown }) => {
      if (!currentRoom || currentRoom !== slug) return;
      io.to(targetSocketId).emit('webrtc:signal', { fromSocketId: socket.id, signal });
    });
    socket.on('webrtc:join-call', ({ slug }: { slug: string }) => {
      if (!currentRoom || currentRoom !== slug) return;
      socket.to(slug).emit('webrtc:peer-joined', { socketId: socket.id });
    });
    socket.on('webrtc:leave-call', ({ slug }: { slug: string }) => {
      if (!currentRoom || currentRoom !== slug) return;
      socket.to(slug).emit('webrtc:peer-left', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      if (!currentRoom) return;
      const participants = roomParticipants.get(currentRoom);
      participants?.delete(socket.id);
      socket.to(currentRoom).emit('presence:leave', { socketId: socket.id });
      socket.to(currentRoom).emit('webrtc:peer-left', { socketId: socket.id });
      if (participants && participants.size === 0) {
        // Last one out: force a final save and free the in-memory doc.
        scheduleSave(currentRoom);
        setTimeout(() => {
          if ((roomParticipants.get(currentRoom!)?.size || 0) === 0) {
            roomDocs.delete(currentRoom!);
            roomParticipants.delete(currentRoom!);
          }
        }, 5000);
      }
    });
  });
}
