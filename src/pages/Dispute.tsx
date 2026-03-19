import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlacardLead } from '../components/layout/PlacardLead';
import { DisputeForm } from '../components/dispute/DisputeForm';
import type { DisputeFormPayload } from '../components/dispute/DisputeForm';
import { Alert, Card } from '../components/ui';

const LEAD_COPY =
  'If something here doesn’t match your life, you can ask us to take another look. A real person reads every request. Official records usually need paperwork (for example, an expungement or dismissal). Community-submitted entries can often be updated when the details are clearly wrong. You don’t have to have everything perfect to start.';

const SUCCESS_MESSAGE =
  'We’ve received your note. Someone on our team will read it with care, usually within about 14 business days. We’ll write back to the email you gave us.';

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
      setError('We couldn’t reach the server. When you’re ready, check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Alert variant="info" title="We got your request">
          <p>{SUCCESS_MESSAGE}</p>
        </Alert>
        <Card variant="ledger" bordered padding="md">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            The entry usually stays visible while we review, sometimes with a &quot;dispute pending&quot;
            note—so others know it’s being looked at.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <PlacardLead kicker="Ask for a second look · Someone reads every note" className="mb-10">
        <div className="mt-4 max-w-2xl">
          <h1
            className="font-display text-4xl font-normal leading-tight tracking-tight text-[var(--color-placard-ink)] sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            If this isn’t right for you
          </h1>
          <p className="mt-4 border-l-2 border-[var(--color-placard-rule)] pl-4 leading-relaxed text-[var(--color-placard-muted)]">
            {LEAD_COPY}
          </p>
        </div>
      </PlacardLead>

      <div className="mx-auto max-w-2xl space-y-6">
        {error && (
          <Alert variant="error" title="We couldn’t send that">
            {error}
          </Alert>
        )}

        <DisputeForm
          initialRecordId={initialRecordId}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
