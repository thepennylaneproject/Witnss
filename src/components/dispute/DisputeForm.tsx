import { useState, useId } from 'react';
import type { DisputeNature } from '../../lib/types';
import { Button, Input, Card } from '../ui';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../../lib/constants';
import { cn } from '../../lib/utils';

const DISPUTE_NATURE_OPTIONS: { value: DisputeNature; label: string }[] = [
  { value: 'misidentification', label: 'This record is not about me (misidentification)' },
  { value: 'expunged_or_vacated', label: 'This conviction/order has been expunged or vacated' },
  { value: 'factually_incorrect', label: 'The details of this record are factually incorrect' },
  { value: 'tier3_false', label: 'This is a Tier 3 submission and it is false' },
  { value: 'other', label: 'Other' },
];

const DESC_MIN = 100;

export interface DisputeFormPayload {
  record_id: string;
  submitter_name: string;
  contact_email: string;
  nature: DisputeNature;
  explanation: string;
  acknowledgment: boolean;
  document?: File;
}

export interface DisputeFormProps {
  initialRecordId?: string;
  onSubmit: (payload: DisputeFormPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function DisputeForm({
  initialRecordId = '',
  onSubmit,
  isSubmitting = false,
}: DisputeFormProps) {
  const [recordId, setRecordId] = useState(initialRecordId);
  const [submitterName, setSubmitterName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [nature, setNature] = useState<DisputeNature | ''>('');
  const [explanation, setExplanation] = useState('');
  const [acknowledgment, setAcknowledgment] = useState(false);
  const [document, setDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const fileInputId = useId();

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!recordId.trim()) next.record_id = 'Record ID is required.';
    if (!submitterName.trim()) next.submitter_name = 'Your full name is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim()) next.contact_email = 'Contact email is required.';
    else if (!emailRegex.test(contactEmail)) next.contact_email = 'Please enter a valid email address.';
    if (!nature) next.nature = 'Please select the nature of your dispute.';
    if (explanation.trim().length < DESC_MIN) {
      next.explanation = `Detailed explanation must be at least ${DESC_MIN} characters.`;
    }
    if (!acknowledgment) {
      next.acknowledgment = 'You must acknowledge the terms before submitting.';
    }
    if (document) {
      if (document.size > MAX_FILE_SIZE_BYTES) next.document = 'File must be 10MB or smaller.';
      const allowed = [...ALLOWED_FILE_TYPES];
      if (!allowed.includes(document.type as (typeof allowed)[number]) && document.type !== 'image/jpeg') {
        next.document = 'File must be PDF, JPG, or PNG.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    await onSubmit({
      record_id: recordId.trim(),
      submitter_name: submitterName.trim(),
      contact_email: contactEmail.trim(),
      nature: nature as DisputeNature,
      explanation: explanation.trim(),
      acknowledgment,
      document: document ?? undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card padding="lg" bordered className="space-y-5">
        <Input
          label="Record ID"
          name="record_id"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          placeholder="e.g. the ID from the record page or URL"
          error={errors.record_id}
          autoComplete="off"
        />
        <Input
          label="Your full name"
          name="submitter_name"
          value={submitterName}
          onChange={(e) => setSubmitterName(e.target.value)}
          placeholder="Full legal name"
          required
          error={errors.submitter_name}
          autoComplete="name"
        />
        <Input
          label="Contact email"
          name="contact_email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="We will respond at this address"
          required
          error={errors.contact_email}
          autoComplete="email"
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="nature"
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Nature of dispute <span className="text-[var(--color-accent)]">*</span>
          </label>
          <select
            id="nature"
            name="nature"
            value={nature}
            onChange={(e) => setNature(e.target.value as DisputeNature)}
            aria-invalid={!!errors.nature}
            className={cn(
              'w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] transition-colors',
              'border-[var(--color-border)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]',
              errors.nature && 'border-[var(--color-accent)]',
            )}
          >
            <option value="">Select one…</option>
            {DISPUTE_NATURE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.nature && (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {errors.nature}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="explanation"
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Detailed explanation <span className="text-[var(--color-accent)]">*</span>
          </label>
          <textarea
            id="explanation"
            name="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Provide a clear explanation (at least 100 characters). For Tier 1/2 records, include reference to documentation (e.g., expungement order, case dismissal) where applicable."
            rows={5}
            minLength={DESC_MIN}
            aria-invalid={!!errors.explanation}
            className={cn(
              'w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors resize-y',
              'border-[var(--color-border)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]',
              errors.explanation && 'border-[var(--color-accent)]',
            )}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Minimum {DESC_MIN} characters. Tier 1/2: strongly recommend attaching supporting documentation.
          </p>
          {errors.explanation && (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {errors.explanation}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={fileInputId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Supporting documentation (optional)
          </label>
          <input
            id={fileInputId}
            type="file"
            name="document"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[var(--color-text-primary)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-2 file:text-sm file:font-medium"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            PDF or image, max 10MB. Optional for Tier 3; strongly recommended for Tier 1/2.
          </p>
          {errors.document && (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {errors.document}
            </p>
          )}
        </div>
        <div className="flex items-start gap-3">
          <input
            id="acknowledgment"
            type="checkbox"
            name="acknowledgment"
            checked={acknowledgment}
            onChange={(e) => setAcknowledgment(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-dispute)] focus:ring-[var(--color-dispute)]"
          />
          <label
            htmlFor="acknowledgment"
            className="text-sm text-[var(--color-text-primary)]"
          >
            I understand that submitting a false dispute is a violation of Witnss terms of use.
          </label>
        </div>
        {errors.acknowledgment && (
          <p className="text-sm text-[var(--color-accent)]" role="alert">
            {errors.acknowledgment}
          </p>
        )}
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
              Submitting…
            </>
          ) : (
            'Submit dispute'
          )}
        </Button>
      </div>
    </form>
  );
}
