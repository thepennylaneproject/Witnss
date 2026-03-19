import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DisputeForm } from '../components/dispute/DisputeForm';
import type { DisputeFormPayload } from '../components/dispute/DisputeForm';
import { Alert, Card } from '../components/ui';

const LEAD_COPY =
  'If you believe a record about you is inaccurate, you may submit a dispute. Disputes are reviewed manually. Records sourced from public court documents will only be removed if you provide documentation that the record is factually incorrect (e.g., expungement order, case dismissal). Tier 3 community-reported records may be removed with appropriate evidence of misidentification or factual error.';

const SUCCESS_MESSAGE =
  'Your dispute has been received and will be reviewed within 14 business days. You will receive a response at the email you provided.';

export default function Dispute() {
  const [searchParams] = useSearchParams();
  const initialRecordId = useMemo(() => searchParams.get('recordId') ?? '', [searchParams]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(payload: DisputeFormPayload) {
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('record_id', payload.record_id);
      formData.append('submitter_name', payload.submitter_name);
      formData.append('contact_email', payload.contact_email);
      formData.append('nature', payload.nature);
      formData.append('explanation', payload.explanation);
      formData.append('acknowledgment', String(payload.acknowledgment));
      if (payload.document) {
        formData.append('document', payload.document);
      }

      const res = await fetch('/.netlify/functions/dispute', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Unable to submit. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Alert variant="info" title="Dispute received">
          <p>{SUCCESS_MESSAGE}</p>
        </Alert>
        <Card padding="md" bordered>
          <p className="text-sm text-[var(--color-text-secondary)]">
            The disputed record will remain visible with a &quot;Dispute Pending&quot; label while under review.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Dispute a record
        </h1>
        <blockquote className="mt-4 border-l-4 border-[var(--color-border-strong)] pl-4 text-[var(--color-text-secondary)] italic leading-relaxed">
          {LEAD_COPY}
        </blockquote>
      </div>

      {error && (
        <Alert variant="error" title="Submission failed">
          {error}
        </Alert>
      )}

      <DisputeForm
        initialRecordId={initialRecordId}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
