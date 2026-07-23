import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { fetchMe } from '../api/auth';
import Logo from '../components/ui/Logo';

// Landing point for Google OAuth: /auth/callback?token=...
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Put the token in the store first so the axios interceptor picks it up
    // — fetchMe() below needs the Authorization header to already be there.
    setToken(token);
    fetchMe()
      .then((user) => {
        setAuth(user, token);
        toast.success(`Welcome, ${user.name}!`);
        navigate('/dashboard');
      })
      .catch(() => navigate('/login'));
  }, [params, navigate, setAuth, setToken]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/15 blur-[110px]" />
      </div>
      <Logo size="lg" />
      <div className="flex items-center gap-3 text-slate-400">
        <motion.span
          className="h-4 w-4 rounded-full border-2 border-slate-700 border-t-brand-500"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
        Signing you in…
      </div>
    </div>
  );
}
