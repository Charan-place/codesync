import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, googleLoginUrl } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { AuthLayout, Field, Divider } from './Signup';

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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Log in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Log in to CodeSync">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-brand-600 py-2.5 font-medium hover:bg-brand-700 disabled:opacity-60">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <Divider />
      <a href={googleLoginUrl()} className="flex items-center justify-center gap-2 w-full rounded-md border border-slate-700 py-2.5 hover:bg-slate-800">
        Continue with Google
      </a>
      <p className="mt-6 text-center text-sm text-slate-400">
        No account yet? <Link to="/signup" className="text-brand-500 hover:underline">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
