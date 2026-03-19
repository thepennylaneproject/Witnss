import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getAccount, isAppwriteConfigured } from '../../lib/appwrite';

export default function AdminGuard() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const acct = getAccount();
    if (!acct) {
      setLoading(false);
      return;
    }

    const account = acct;

    async function checkSession() {
      try {
        await account.get();
        if (!mounted) return;
        setAuthenticated(true);
      } catch {
        if (!mounted) return;
        navigate('/admin/login', { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkSession();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    );
  }

  if (!isAppwriteConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="max-w-md rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-[var(--color-text-primary)]">Admin requires Appwrite</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Set <code className="text-[var(--color-text-primary)]">VITE_APPWRITE_ENDPOINT</code> and{' '}
            <code className="text-[var(--color-text-primary)]">VITE_APPWRITE_PROJECT_ID</code> in{' '}
            <code className="text-[var(--color-text-primary)]">.env</code>, then restart the dev server.
            See <code className="text-[var(--color-text-primary)]">.env.example</code> and{' '}
            <code className="text-[var(--color-text-primary)]">docs/APPWRITE_SETUP.md</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <Outlet />;
}
