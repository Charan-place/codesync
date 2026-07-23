import { Buffer } from 'node:buffer';
import mongoose, { Schema, Document } from 'mongoose';

export type RoomVisibility = 'public-link' | 'password' | 'private';
export type ParticipantRole = 'host' | 'editor' | 'viewer';

export interface IRoomFile {
  name: string;
  language: string;
}

export interface IRoom extends Document {
  slug: string;
  title: string;
  ownerId?: mongoose.Types.ObjectId;
  files: IRoomFile[];
  visibility: RoomVisibility;
  passwordHash?: string;
  expiresAt?: Date;
  ydocState?: Buffer; // persisted Yjs document snapshot
  createdAt: Date;
  lastActiveAt: Date;
}

const roomFileSchema = new Schema<IRoomFile>(
  { name: { type: String, required: true }, language: { type: String, default: 'javascript' } },
  { _id: false }
);

const roomSchema = new Schema<IRoom>({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'Untitled room' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  files: { type: [roomFileSchema], default: [{ name: 'index.js', language: 'javascript' }] },
  visibility: { type: String, enum: ['public-link', 'password', 'private'], default: 'public-link' },
  passwordHash: { type: String, select: false },
  expiresAt: { type: Date },
  ydocState: { type: Buffer, select: false },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

// TTL index: rooms with an expiresAt in the past get reaped automatically.
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRoom>('Room', roomSchema);
