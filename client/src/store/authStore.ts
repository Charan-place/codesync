import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

const storedToken = localStorage.getItem('codesync_token');
const storedUser = localStorage.getItem('codesync_user');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  setAuth: (user, token) => {
    localStorage.setItem('codesync_token', token);
    localStorage.setItem('codesync_user', JSON.stringify(user));
    set({ user, token });
  },
  // Sets just the token in the store (and localStorage) ahead of a `me` call.
  // The axios request interceptor reads the token from this store, not from
  // localStorage directly, so the token has to land here *before* any
  // authenticated request is made — otherwise that first request goes out
  // with no Authorization header at all.
  setToken: (token) => {
    localStorage.setItem('codesync_token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('codesync_token');
    localStorage.removeItem('codesync_user');
    set({ user: null, token: null });
  },
}));
