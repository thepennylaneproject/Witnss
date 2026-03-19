import { useState } from 'react';
import { SubmissionForm } from '../components/submission/SubmissionForm';
import type { SubmissionFormPayload } from '../components/submission/SubmissionForm';
import { Alert, Card } from '../components/ui';

const SAFETY_MESSAGE =
  'If you are in immediate danger, call 911. National DV Hotline: 1-800-799-7233 (TTY: 1-800-787-3224). Chat: thehotline.org';

const INTRO_COPY =
  'You can submit an account of abuse you experienced or witnessed. Your submission is anonymous by default. If two or more independent submissions match, the record may be elevated for review. Submitting false information is a violation of our terms.';

const THANK_YOU_MESSAGE =
  'Your account has been received. If it corroborates an existing submission, it will be reviewed for the record.';

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
        setError(data.message ?? data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch (e) {
      setError('Unable to submit. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Alert variant="info" title="Thank you">
          <p className="mb-3">{THANK_YOU_MESSAGE}</p>
          <p className="font-medium text-[var(--color-text-primary)]">{SAFETY_MESSAGE}</p>
        </Alert>
        <Card variant="sheet" padding="md">
          <p className="text-sm text-[var(--color-text-secondary)]">
            We do not confirm or deny whether a matching record exists. Your submission is stored securely and reviewed according to our process.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Alert variant="warning" title="Your safety matters">
        {SAFETY_MESSAGE}
      </Alert>

      <div>
        <h1
          className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          Submit an account
        </h1>
        <p className="mt-3 text-[var(--color-text-secondary)] leading-relaxed">
          {INTRO_COPY}
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Submission failed">
          {error}
        </Alert>
      )}

      <SubmissionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
