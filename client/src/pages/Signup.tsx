import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { registerUser, googleLoginUrl } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../utils/errors';
import AuthLayout from '../components/ui/AuthLayout';
import { Field, Divider } from '../components/ui/Input';
import Button from '../components/ui/Button';
import GoogleButton from '../components/ui/GoogleButton';

export default function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, token } = await registerUser(name, email, password);
      setAuth(user, token);
      toast.success(`Welcome to CodeSync, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Sign up failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Free forever for quick pairing sessions.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} type="text" autoComplete="name" />
        <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
        />
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
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
      <Divider />
      <GoogleButton href={googleLoginUrl()} />
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
