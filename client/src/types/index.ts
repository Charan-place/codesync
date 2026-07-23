export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type RoomVisibility = 'public-link' | 'password' | 'private';
export type ParticipantRole = 'host' | 'editor' | 'viewer';

export interface RoomFile {
  name: string;
  language: string;
}

export interface Room {
  slug: string;
  title: string;
  ownerId?: string;
  files: RoomFile[];
  visibility: RoomVisibility;
  hasPassword: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Participant {
  socketId: string;
  name: string;
  color: string;
  role: ParticipantRole;
  userId?: string;
}

export interface ChatMessage {
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Snippet {
  _id: string;
  title: string;
  content: string;
  language: string;
  savedAt: string;
}
