import { useState } from 'react';
import { PlacardLead } from '../components/layout/PlacardLead';
import { SubmissionForm } from '../components/submission/SubmissionForm';
import type { SubmissionFormPayload } from '../components/submission/SubmissionForm';
import { Alert, Card } from '../components/ui';

const SAFETY_MESSAGE =
  'If you’re in immediate danger, call 911. For confidential support: National DV Hotline 1-800-799-7233 (TTY 1-800-787-3224) · thehotline.org';

const INTRO_COPY =
  'This space is for what you lived through or saw happen to someone else. You choose how much to share. Staying anonymous is the default. When separate accounts line up, our team may review them together. Honest information protects people; harmful false reports can do real damage.';

const THANK_YOU_MESSAGE =
  'Thank you for trusting us with your words. We’ve received what you shared. If it connects with another independent account, we’ll review with care. There’s nothing else you need to do right now.';

export default function Submit() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(payload: SubmissionFormPayload) {
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('subject_name', payload.subject_name);
      formData.append('subject_aliases', payload.subject_aliases);
      formData.append('subject_state', payload.subject_state);
      formData.append('subject_county', payload.subject_county);
      formData.append('incident_type', payload.incident_type);
      formData.append('incident_date', payload.incident_date);
      formData.append('description', payload.description);
      formData.append('anonymous', String(payload.anonymous));
      formData.append('contact_email', payload.contact_email);
      if (payload.document) {
        formData.append('document', payload.document);
      }

      const res = await fetch('/.netlify/functions/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'We couldn’t save that just now. You can try again when you feel ready.');
        return;
      }

      setSubmitted(true);
    } catch (e) {
      setError('We couldn’t reach the server. When you’re ready, check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Alert variant="info" title="We’re holding this with care">
          <p className="mb-3">{THANK_YOU_MESSAGE}</p>
          <p className="text-[var(--color-text-primary)]">{SAFETY_MESSAGE}</p>
        </Alert>
        <Card variant="ledger" bordered padding="md">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            We don’t confirm whether a matching file already exists. What you sent is stored securely
            and handled according to our review process.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <PlacardLead kicker="Your story · Your pace · Anonymous unless you choose otherwise" className="mb-10">
        <div className="mt-4 max-w-2xl">
          <h1
            className="font-display text-4xl font-normal leading-tight tracking-tight text-[var(--color-placard-ink)] sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Share what happened
          </h1>
          <p className="mt-4 leading-relaxed text-[var(--color-placard-muted)]">{INTRO_COPY}</p>
        </div>
        <Alert variant="info" surface="placard" title="If you need help right now" className="mt-8">
          {SAFETY_MESSAGE}
        </Alert>
      </PlacardLead>

      <div className="mx-auto max-w-2xl space-y-6">
        {error && (
          <Alert variant="error" title="We couldn’t save that">
            {error}
          </Alert>
        )}
        <SubmissionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
