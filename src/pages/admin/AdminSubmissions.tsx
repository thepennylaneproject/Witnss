import { useEffect, useState } from 'react';
import { getAdminBearerToken } from '../../lib/appwrite';
import { Button } from '../../components/ui/Button';
import { OFFENSE_TYPE_LABELS } from '../../lib/types';

interface SubmissionRow {
  id: string;
  subject_name: string;
  subject_state: string;
  incident_type: string;
  created_at: string;
  corroboration_count: number;
  supporting_doc_url: string | null;
  review_status: string;
}

export default function AdminSubmissions() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchList() {
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-submissions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || `HTTP ${res.status}`);
      setRows([]);
      return;
    }
    const data = await res.json();
    setRows(data.submissions ?? []);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchList();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function approve(id: string) {
    setActionLoading(id);
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'approve', submission_id: id }),
    });
    setActionLoading(null);
    if (res.ok) await fetchList();
    else setError((await res.json().catch(() => ({}))).error || 'Failed');
  }

  async function reject(id: string) {
    setActionLoading(id);
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'reject', submission_id: id }),
    });
    setActionLoading(null);
    if (res.ok) await fetchList();
    else setError((await res.json().catch(() => ({}))).error || 'Failed');
  }

  async function viewDocument(fileId: string | null) {
    if (!fileId) return;
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileId }),
    });
    if (!res.ok) return;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  if (loading) {
    return <p className="text-[var(--color-text-secondary)]">Loading submissions...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Submission Review Queue</h1>
      {error && (
        <p className="text-sm text-[var(--color-accent)]" role="alert">{error}</p>
      )}
      <div className="overflow-x-auto rounded-none border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Subject</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">State</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Incident type</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Submitted at</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Corroboration</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Document</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.id}
                className={`border-b border-[var(--color-border)] ${(s.corroboration_count ?? 0) >= 2 ? 'bg-amber-500/10' : ''}`}
              >
                <td className="px-3 py-2 text-[var(--color-text-primary)]">{s.subject_name}</td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">{s.subject_state}</td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                  {OFFENSE_TYPE_LABELS[s.incident_type as keyof typeof OFFENSE_TYPE_LABELS] ?? s.incident_type}
                </td>
                <td className="px-3 py-2 text-[var(--color-text-muted)]">
                  {new Date(s.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">{s.corroboration_count ?? 1}</td>
                <td className="px-3 py-2">{s.supporting_doc_url ? 'Yes' : '—'}</td>
                <td className="px-3 py-2 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => approve(s.id)}
                    disabled={!!actionLoading}
                  >
                    Approve → Tier 3
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => reject(s.id)}
                    disabled={!!actionLoading}
                  >
                    Reject
                  </Button>
                  {s.supporting_doc_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewDocument(s.supporting_doc_url)}
                    >
                      View document
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && !error && (
        <p className="text-sm text-[var(--color-text-muted)]">No pending or corroborated submissions.</p>
      )}
    </div>
  );
}
