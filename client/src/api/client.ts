import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      const wasLoggedIn = !!useAuthStore.getState().token;
      useAuthStore.getState().logout();
      if (wasLoggedIn) toast.error('Your session expired — please log in again.');
    } else if (!err.response) {
      toast.error("Can't reach the server. Check your connection and try again.");
    } else if (status >= 500) {
      toast.error('Something went wrong on our end. Please try again.');
    }
    return Promise.reject(err);
  }
);
