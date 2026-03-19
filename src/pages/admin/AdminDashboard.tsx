import { useEffect, useState } from 'react';
import { getAdminBearerToken } from '../../lib/appwrite';

interface AdminStats {
  counts: {
    activeRecords: number;
    pendingSubmissions: number;
    openDisputes: number;
    recordsUnderReview: number;
  };
  recentSubmissions: Array<{
    id: string;
    subject_name: string;
    incident_type: string;
    created_at: string;
  }>;
  recentDisputes: Array<{
    id: string;
    record_id: string;
    subject_name: string;
    claim_preview: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      const token = await getAdminBearerToken();
      if (!token) return;
      try {
        const res = await fetch('/.netlify/functions/admin-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="text-[var(--color-text-secondary)]">Loading dashboard...</p>;
  }
  if (error) {
    return (
      <p className="text-[var(--color-accent)]" role="alert">
        {error}
      </p>
    );
  }
  if (!stats) {
    return null;
  }

  const { counts, recentSubmissions, recentDisputes } = stats;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Total active records</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
            {counts.activeRecords}
          </p>
        </div>
        <div className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Pending submissions</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
            {counts.pendingSubmissions}
          </p>
        </div>
        <div className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Open disputes</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
            {counts.openDisputes}
          </p>
        </div>
        <div className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Records under review</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
            {counts.recordsUnderReview}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
            Recent submissions (last 10)
          </h2>
          <ul className="mt-3 space-y-2">
            {recentSubmissions.length === 0 ? (
              <li className="text-sm text-[var(--color-text-muted)]">None</li>
            ) : (
              recentSubmissions.map((s) => (
                <li key={s.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-[var(--color-text-primary)]">{s.subject_name}</span>
                  <span className="text-[var(--color-text-muted)]">{s.incident_type}</span>
                  <span className="text-[var(--color-text-muted)]">
                    {new Date(s.created_at).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
            Recent disputes (last 10)
          </h2>
          <ul className="mt-3 space-y-2">
            {recentDisputes.length === 0 ? (
              <li className="text-sm text-[var(--color-text-muted)]">None</li>
            ) : (
              recentDisputes.map((d) => (
                <li key={d.id} className="flex flex-col gap-0.5 text-sm">
                  <span className="text-[var(--color-text-primary)]">{d.subject_name}</span>
                  <span className="text-[var(--color-text-muted)]">{d.claim_preview}</span>
                  <span className="text-[var(--color-text-muted)]">
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
