import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input } from '../../components/ui';
import ConsistencyPulse from '../../components/pulse/ConsistencyPulse';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form);
      navigate(data.role === 'INSTRUCTOR' ? '/instructor' : '/student');
    } catch (err) {
      setError(err.response?.data || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient pulse lines in the background — echoes the signature element */}
      <div className="absolute inset-0 flex flex-col justify-around opacity-[0.06] pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <ConsistencyPulse
            key={i}
            results={i % 3 === 0 ? [true, false] : i % 3 === 1 ? [true, true] : [false, false]}
            classification={i % 3 === 0 ? 'GUESSED' : i % 3 === 1 ? 'MASTERED' : 'NOT_UNDERSTOOD'}
            width={window.innerWidth}
            height={40}
          />
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <ConsistencyPulse results={[true, false]} classification="GUESSED" width={56} height={24} />
          </div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-text)]">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
            Sign in to continue to your quiz engine
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              placeholder="you@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {error && (
              <p className="text-sm text-[var(--color-danger)]">{String(error)}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--color-accent)] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
