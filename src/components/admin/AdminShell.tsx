import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getAccount } from '../../lib/appwrite';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/records', label: 'Records' },
] as const;

export default function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    const acct = getAccount();
    if (acct) {
      try {
        await acct.deleteSession({ sessionId: 'current' });
      } catch {
        /* ignore */
      }
    }
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-4">
            {NAV.map(({ to, label }) => {
              const isActive = to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'text-sm font-medium hover:text-[var(--color-text-primary)]',
                    isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
