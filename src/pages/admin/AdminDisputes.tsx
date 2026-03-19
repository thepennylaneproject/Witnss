import { useEffect, useState } from 'react';
import { getAdminBearerToken } from '../../lib/appwrite';
import { Button } from '../../components/ui/Button';

interface DisputeRow {
  id: string;
  record_id: string;
  subject_name: string;
  claim_preview: string;
  created_at: string;
  evidence_url: string | null;
  status: string;
}

export default function AdminDisputes() {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchList() {
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-disputes', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || `HTTP ${res.status}`);
      setRows([]);
      return;
    }
    const data = await res.json();
    setRows(data.disputes ?? []);
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

  async function updateStatus(disputeId: string, action: 'under_review' | 'resolved_removed' | 'resolved_retained') {
    setActionLoading(disputeId);
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dispute_id: disputeId, action }),
    });
    setActionLoading(null);
    if (res.ok) await fetchList();
    else setError((await res.json().catch(() => ({}))).error || 'Failed');
  }

  async function viewEvidence(fileId: string | null) {
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
    return <p className="text-[var(--color-text-secondary)]">Loading disputes...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Dispute Review Queue</h1>
      {error && (
        <p className="text-sm text-[var(--color-accent)]" role="alert">{error}</p>
      )}
      <div className="overflow-x-auto rounded-none border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Record ID</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Subject name</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Dispute type</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Submitted at</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Evidence</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-[var(--color-border)]">
                <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)]">{d.record_id}</td>
                <td className="px-3 py-2 text-[var(--color-text-primary)]">{d.subject_name}</td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)] max-w-[200px] truncate" title={d.claim_preview}>
                  {d.claim_preview || '—'}
                </td>
                <td className="px-3 py-2 text-[var(--color-text-muted)]">
                  {new Date(d.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{d.evidence_url ? 'Yes' : '—'}</td>
                <td className="px-3 py-2 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus(d.id, 'under_review')}
                    disabled={!!actionLoading || d.status === 'under_review'}
                  >
                    Mark Under Review
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => updateStatus(d.id, 'resolved_removed')}
                    disabled={!!actionLoading}
                  >
                    Resolve — Remove Record
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus(d.id, 'resolved_retained')}
                    disabled={!!actionLoading}
                  >
                    Resolve — Retain Record
                  </Button>
                  {d.evidence_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewEvidence(d.evidence_url)}
                    >
                      View evidence
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && !error && (
        <p className="text-sm text-[var(--color-text-muted)]">No pending or under-review disputes.</p>
      )}
    </div>
  );
}
