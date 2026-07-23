import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Room from '../models/Room';
import { generateSlug } from '../utils/slug';
import { AuthedRequest } from '../middleware/auth';
import { env } from '../config/env';

function publicRoom(room: any) {
  return {
    slug: room.slug,
    title: room.title,
    ownerId: room.ownerId,
    files: room.files,
    visibility: room.visibility,
    hasPassword: !!room.passwordHash,
    expiresAt: room.expiresAt,
    createdAt: room.createdAt,
  };
}

export async function createRoom(req: AuthedRequest, res: Response) {
  const { title, ttlHours, visibility, password } = req.body;
  const slug = generateSlug();
  const expiresAt =
    ttlHours && Number(ttlHours) > 0
      ? new Date(Date.now() + Number(ttlHours) * 60 * 60 * 1000)
      : req.userId
        ? undefined // signed-in users can opt out of expiry
        : new Date(Date.now() + env.defaultRoomTtlHours * 60 * 60 * 1000); // guests always expire

  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

  const room = await Room.create({
    slug,
    title: title || 'Untitled room',
    ownerId: req.userId || undefined,
    visibility: visibility || (password ? 'password' : 'public-link'),
    passwordHash,
    expiresAt,
  });

  res.status(201).json({ room: publicRoom(room) });
}

export async function getRoom(req: AuthedRequest, res: Response) {
  const room = await Room.findOne({ slug: req.params.slug });
  if (!room) return res.status(404).json({ error: 'Room not found or expired' });

  if (room.visibility === 'private' && String(room.ownerId) !== req.userId) {
    return res.status(403).json({ error: 'This room is private' });
  }
  res.json({ room: publicRoom(room) });
}

export async function verifyRoomPassword(req: AuthedRequest, res: Response) {
  const room = await Room.findOne({ slug: req.params.slug }).select('+passwordHash');
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!room.passwordHash) return res.json({ ok: true });
  const ok = await bcrypt.compare(req.body.password || '', room.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });
  res.json({ ok: true });
}

export async function updateRoom(req: AuthedRequest, res: Response) {
  const room = await Room.findOne({ slug: req.params.slug });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!room.ownerId || String(room.ownerId) !== req.userId) {
    return res.status(403).json({ error: 'Only the room owner can change settings' });
  }
  const { title, visibility, ttlHours, password } = req.body;
  if (title) room.title = title;
  if (visibility) room.visibility = visibility;
  if (password !== undefined) {
    room.passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
  }
  if (ttlHours !== undefined) {
    room.expiresAt = Number(ttlHours) > 0 ? new Date(Date.now() + Number(ttlHours) * 60 * 60 * 1000) : undefined;
  }
  await room.save();
  res.json({ room: publicRoom(room) });
}

export async function myRooms(req: AuthedRequest, res: Response) {
  const rooms = await Room.find({ ownerId: req.userId }).sort({ lastActiveAt: -1 }).limit(50);
  res.json({ rooms: rooms.map(publicRoom) });
}
