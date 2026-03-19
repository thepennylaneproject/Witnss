import { useEffect, useState } from 'react';
import { getAdminBearerToken } from '../../lib/appwrite';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { RecordTier, OffenseType, RecordStatus } from '../../lib/types';
import { OFFENSE_TYPE_LABELS, SOURCE_TYPE_LABELS } from '../../lib/types';

interface RecordRow {
  id: string;
  person_id: string;
  full_name: string;
  tier: number;
  offense_type: string;
  status: string;
  jurisdiction_state: string;
  created_at: string;
}

export default function AdminRecords() {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  async function fetchList() {
    const token = await getAdminBearerToken();
    if (!token) return;
    const url = new URL('/.netlify/functions/admin-records', window.location.origin);
    if (search.trim()) url.searchParams.set('q', search.trim());
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || `HTTP ${res.status}`);
      setRows([]);
      return;
    }
    const data = await res.json();
    setRows(data.records ?? []);
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
  }, [search]);

  async function updateStatus(recordId: string, status: RecordStatus) {
    setActionLoading(recordId);
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-records', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ record_id: recordId, status }),
    });
    setActionLoading(null);
    if (res.ok) await fetchList();
    else setError((await res.json().catch(() => ({}))).error || 'Failed');
  }

  if (loading && rows.length === 0) {
    return <p className="text-[var(--color-text-secondary)]">Loading records...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Record Management</h1>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? 'Cancel' : 'Add Tier 1/2 Record'}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-[var(--color-accent)]" role="alert">{error}</p>
      )}
      {showAddForm && (
        <AddRecordForm
          onSuccess={() => {
            setShowAddForm(false);
            fetchList();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      <div className="overflow-x-auto rounded-none border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Record ID</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Subject</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Tier</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Offense</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">State</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Status</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-border)]">
                <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)]">{r.id}</td>
                <td className="px-3 py-2 text-[var(--color-text-primary)]">{r.full_name}</td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">{r.tier}</td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                  {OFFENSE_TYPE_LABELS[r.offense_type as OffenseType] ?? r.offense_type}
                </td>
                <td className="px-3 py-2 text-[var(--color-text-muted)]">{r.jurisdiction_state}</td>
                <td className="px-3 py-2 text-[var(--color-text-secondary)]">{r.status}</td>
                <td className="px-3 py-2 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => updateStatus(r.id, 'removed')}
                    disabled={!!actionLoading || r.status === 'removed'}
                  >
                    Soft-delete
                  </Button>
                  {r.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus(r.id, 'active')}
                      disabled={!!actionLoading}
                    >
                      Set active
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && !error && (
        <p className="text-sm text-[var(--color-text-muted)]">No records found.</p>
      )}
    </div>
  );
}

interface AddRecordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AddRecordForm({ onSuccess, onCancel }: AddRecordFormProps) {
  const [tier, setTier] = useState<RecordTier>(1);
  const [fullName, setFullName] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [offenseType, setOffenseType] = useState<OffenseType>('domestic_assault');
  const [offenseDate, setOffenseDate] = useState('');
  const [jurisdictionState, setJurisdictionState] = useState('');
  const [jurisdictionCounty, setJurisdictionCounty] = useState('');
  const [sourceType, setSourceType] = useState<'conviction' | 'protective_order' | 'police_report' | 'civil_filing'>('conviction');
  const [sourceReference, setSourceReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const token = await getAdminBearerToken();
    if (!token) return;
    const res = await fetch('/.netlify/functions/admin-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tier,
        full_name: fullName.trim(),
        state: state.trim(),
        county: county.trim() || null,
        offense_type: offenseType,
        offense_date: offenseDate.trim() || null,
        jurisdiction_state: jurisdictionState.trim(),
        jurisdiction_county: jurisdictionCounty.trim() || null,
        source_type: sourceType,
        source_reference: sourceReference.trim() || null,
      }),
    });
    setSubmitting(false);
    if (res.ok) onSuccess();
    else {
      const err = await res.json().catch(() => ({}));
      setFormError(err.error || 'Failed to create record');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4">
      <h2 className="text-sm font-medium text-[var(--color-text-primary)]">Add Tier 1 or Tier 2 Record</h2>
      {formError && <p className="text-sm text-[var(--color-accent)]">{formError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <div className="flex gap-2">
          <Input label="Tier (1 or 2)" type="number" min={1} max={2} value={tier} onChange={(e) => setTier(Number(e.target.value) as RecordTier)} required />
          <Input label="State" value={state} onChange={(e) => setState(e.target.value)} required />
          <Input label="County" value={county} onChange={(e) => setCounty(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Offense type</label>
          <select
            value={offenseType}
            onChange={(e) => setOffenseType(e.target.value as OffenseType)}
            className="mt-1 w-full rounded-none border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            {(Object.entries(OFFENSE_TYPE_LABELS) as [OffenseType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <Input label="Offense date" type="date" value={offenseDate} onChange={(e) => setOffenseDate(e.target.value)} />
        <Input label="Jurisdiction state" value={jurisdictionState} onChange={(e) => setJurisdictionState(e.target.value)} required />
        <Input label="Jurisdiction county" value={jurisdictionCounty} onChange={(e) => setJurisdictionCounty(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Source type</label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as typeof sourceType)}
            className="mt-1 w-full rounded-none border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            {(Object.entries(SOURCE_TYPE_LABELS) as [keyof typeof SOURCE_TYPE_LABELS, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <Input label="Source reference (case/docket)" value={sourceReference} onChange={(e) => setSourceReference(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create record'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
