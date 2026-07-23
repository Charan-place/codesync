import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { fetchMe } from '../api/auth';

// Landing point for Google OAuth: /auth/callback?token=...
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    localStorage.setItem('codesync_token', token);
    fetchMe()
      .then((user) => {
        setAuth(user, token);
        navigate('/dashboard');
      })
      .catch(() => navigate('/login'));
  }, [params, navigate, setAuth]);

  return <div className="min-h-screen flex items-center justify-center text-slate-400">Signing you in…</div>;
}
