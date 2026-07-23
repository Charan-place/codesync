import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginUser, googleLoginUrl } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../components/ui/AuthLayout';
import { Field, Divider } from '../components/ui/Input';
import Button from '../components/ui/Button';
import GoogleButton from '../components/ui/GoogleButton';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, token } = await loginUser(email, password);
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Log in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Log in to CodeSync" subtitle="Pick up right where you left off.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" autoComplete="current-password" />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <Divider />
      <GoogleButton href={googleLoginUrl()} />
      <p className="mt-6 text-center text-sm text-slate-400">
        No account yet?{' '}
        <Link to="/signup" className="text-brand-400 hover:text-brand-300 transition-colors">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
