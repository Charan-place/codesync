import { api } from './client';
import type { Room } from '../types';

export async function createRoom(opts: { title?: string; ttlHours?: number; visibility?: string; password?: string }) {
  const { data } = await api.post<{ room: Room }>('/rooms', opts);
  return data.room;
}

export async function getRoom(slug: string) {
  const { data } = await api.get<{ room: Room }>(`/rooms/${slug}`);
  return data.room;
}

export async function verifyRoomPassword(slug: string, password: string) {
  await api.post(`/rooms/${slug}/verify-password`, { password });
}

export async function updateRoom(slug: string, patch: Partial<{ title: string; visibility: string; ttlHours: number; password: string | null }>) {
  const { data } = await api.patch<{ room: Room }>(`/rooms/${slug}`, patch);
  return data.room;
}

export async function myRooms() {
  const { data } = await api.get<{ rooms: Room[] }>('/rooms/mine');
  return data.rooms;
}

export async function executeCode(slug: string, language: string, code: string) {
  const { data } = await api.post(`/rooms/${slug}/execute`, { language, code });
  return data as { stdout: string; stderr: string; timedOut: boolean };
}
