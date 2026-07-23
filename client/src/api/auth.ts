import { api } from './client';
import type { User } from '../types';

export async function registerUser(name: string, email: string, password: string) {
  const { data } = await api.post<{ user: User; token: string }>('/auth/register', { name, email, password });
  return data;
}

export async function loginUser(email: string, password: string) {
  const { data } = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export function googleLoginUrl(): string {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${base}/auth/google`;
}
