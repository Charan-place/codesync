import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, googleLoginUrl } from '../api/auth';
import { useAuthStore } from '../store/authStore';

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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} type="text" />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" hint="At least 8 characters" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-brand-600 py-2.5 font-medium hover:bg-brand-700 disabled:opacity-60">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <Divider />
      <a href={googleLoginUrl()} className="flex items-center justify-center gap-2 w-full rounded-md border border-slate-700 py-2.5 hover:bg-slate-800">
        Continue with Google
      </a>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account? <Link to="/login" className="text-brand-500 hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-6">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type, hint }: { label: string; value: string; onChange: (v: string) => void; type: string; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px bg-slate-800 flex-1" />
      <span className="text-xs text-slate-500">or</span>
      <div className="h-px bg-slate-800 flex-1" />
    </div>
  );
}
