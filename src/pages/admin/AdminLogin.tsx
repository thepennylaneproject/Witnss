import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccount, isAppwriteConfigured } from '../../lib/appwrite';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const acct = getAccount();
    if (!acct) return;
    acct
      .get()
      .then(() => navigate('/admin', { replace: true }))
      .catch(() => {
        /* not logged in */
      });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const acct = getAccount();
    if (!acct) {
      setError(
        'Appwrite is not configured. Add VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID to .env',
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await acct.createEmailPasswordSession({ email, password });
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Admin sign in</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Witnss internal admin panel
        </p>
        {!isAppwriteConfigured && (
          <p className="mt-4 rounded-none border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Copy <code className="text-[var(--color-text-primary)]">.env.example</code> to{' '}
            <code className="text-[var(--color-text-primary)]">.env</code> and set{' '}
            <code className="text-[var(--color-text-primary)]">VITE_APPWRITE_ENDPOINT</code> and{' '}
            <code className="text-[var(--color-text-primary)]">VITE_APPWRITE_PROJECT_ID</code>. Create an
            admin user in the Appwrite console (Auth). Restart the dev server after saving.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            type="email"
            name="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading || !isAppwriteConfigured}
          />
          <Input
            type="password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading || !isAppwriteConfigured}
          />
          {error && (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading || !isAppwriteConfigured} className="w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
