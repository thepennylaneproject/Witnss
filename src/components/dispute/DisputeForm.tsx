import { useState, useId } from 'react';
import type { DisputeNature } from '../../lib/types';
import { Button, Input } from '../ui';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { ledgerCheckboxClass, ledgerFieldClass, ledgerFieldErrorClass, ledgerFileInputClass } from '../../lib/fieldStyles';

const DISPUTE_NATURE_OPTIONS: { value: DisputeNature; label: string }[] = [
  { value: 'misidentification', label: 'This isn’t about me — wrong person' },
  { value: 'expunged_or_vacated', label: 'A court cleared or removed this (expungement, dismissal, etc.)' },
  { value: 'factually_incorrect', label: 'Something here doesn’t match what happened' },
  { value: 'tier3_false', label: 'This community-reported entry shouldn’t be here' },
  { value: 'other', label: 'Something else — I’ll explain below' },
];

const DESC_MIN = 100;
const recordLabelClass = 'font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-text-secondary)]';
const recordSectionTitleClass =
  'font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]';
const requiredMarkClass = 'text-[var(--color-text-muted)]';
const formErrorClass = 'text-sm text-[var(--color-feedback)]';
const formHintClass = 'font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-gentle)]';
const typewriterInputClass =
  'rounded-none border-0 border-b border-[var(--color-border)] bg-transparent px-0 py-2 focus:border-[var(--color-text-secondary)]';
const typewriterSelectClass = cn(ledgerFieldClass, typewriterInputClass);
const typewriterFileClass = cn(
  ledgerFileInputClass,
  'rounded-none border-0 border-b border-[var(--color-border)] bg-transparent px-0 py-2 file:rounded-none',
);

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
    if (!recordId.trim()) next.record_id = 'We need the record ID from the page or link so we open the right file.';
    if (!submitterName.trim()) next.submitter_name = 'Your full name helps us respond to you personally.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim()) next.contact_email = 'An email address lets us write you back when there’s news.';
    else if (!emailRegex.test(contactEmail)) next.contact_email = 'That email doesn’t look quite right—check for typos?';
    if (!nature) next.nature = 'Pick the option that’s closest; you can say more in your note.';
    if (explanation.trim().length < DESC_MIN) {
      next.explanation = `A little more context helps (${DESC_MIN} characters). Go at your own pace.`;
    }
    if (!acknowledgment) {
      next.acknowledgment = 'Please check the box above when you’re ready to send.';
    }
    if (document) {
      if (document.size > MAX_FILE_SIZE_BYTES) next.document = 'Files need to be 10MB or smaller.';
      const allowed = [...ALLOWED_FILE_TYPES];
      if (!allowed.includes(document.type as (typeof allowed)[number]) && document.type !== 'image/jpeg') {
        next.document = 'PDF, JPG, or PNG work best here.';
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
      <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
        If something here doesn’t match your life, you can ask us to look at it. Tell us what
        feels wrong in your own words. Documents help but aren’t required to start.
      </p>
      <section className="space-y-5">
        <p className={recordSectionTitleClass}>How we can reach you</p>
        <Input
          label={<span className={recordLabelClass}>Record ID</span>}
          name="record_id"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          placeholder="ID from the record page or URL"
          error={errors.record_id}
          autoComplete="off"
          className={typewriterInputClass}
        />
        <Input
          label={<span className={recordLabelClass}>Your name</span>}
          name="submitter_name"
          value={submitterName}
          onChange={(e) => setSubmitterName(e.target.value)}
          placeholder="Name you use officially"
          required
          error={errors.submitter_name}
          autoComplete="name"
          className={typewriterInputClass}
        />
        <Input
          label={<span className={recordLabelClass}>Reply email</span>}
          name="contact_email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Address where we should send updates"
          required
          error={errors.contact_email}
          autoComplete="email"
          className={typewriterInputClass}
        />
      </section>
      <section className="space-y-5 border-t border-[var(--color-border)] pt-6">
        <p className={recordSectionTitleClass}>What you’d like us to review</p>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="nature"
            className={recordLabelClass}
          >
            What fits best <span className={requiredMarkClass}>*</span>
          </label>
          <select
            id="nature"
            name="nature"
            value={nature}
            onChange={(e) => setNature(e.target.value as DisputeNature)}
            aria-invalid={!!errors.nature}
            className={cn(
              typewriterSelectClass,
              errors.nature && ledgerFieldErrorClass,
            )}
          >
            <option value="">Choose a category</option>
            {DISPUTE_NATURE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.nature && (
            <p className={formErrorClass} role="alert">
              {errors.nature}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="explanation"
            className={recordLabelClass}
          >
            Your note <span className={requiredMarkClass}>*</span>
          </label>
          <textarea
            id="explanation"
            name="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Write what should be corrected and why. If possible, include dates, references, and source details."
            rows={5}
            minLength={DESC_MIN}
            aria-invalid={!!errors.explanation}
            className={cn(
              typewriterSelectClass,
              'resize-y',
              errors.explanation && ledgerFieldErrorClass,
            )}
          />
          <p className={formHintClass}>At least {DESC_MIN} characters</p>
          {errors.explanation && (
            <p className={formErrorClass} role="alert">
              {errors.explanation}
            </p>
          )}
        </div>
      </section>
      <section className="space-y-5 border-t border-[var(--color-border)] pt-6">
        <p className={recordSectionTitleClass}>If you have files to share</p>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={fileInputId}
            className={recordLabelClass}
          >
            Supporting documentation (optional)
          </label>
          <input
            id={fileInputId}
            type="file"
            name="document"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
            className={typewriterFileClass}
          />
          <p className={formHintClass}>
            PDF or image, up to 10MB. Helpful for official records, not required to begin.
          </p>
          {errors.document && (
            <p className={formErrorClass} role="alert">
              {errors.document}
            </p>
          )}
        </div>
      </section>
      <section className="space-y-3 border-t border-[var(--color-border)] pt-6">
        <p className={recordSectionTitleClass}>Before you send</p>
        <div className="flex items-start gap-3">
          <input
            id="acknowledgment"
            type="checkbox"
            name="acknowledgment"
            checked={acknowledgment}
            onChange={(e) => setAcknowledgment(e.target.checked)}
            className={cn('mt-1', ledgerCheckboxClass)}
          />
          <label
            htmlFor="acknowledgment"
            className="text-sm text-[var(--color-text-primary)]"
          >
            I’m sharing this in good faith and to the best of my knowledge.
          </label>
        </div>
        {errors.acknowledgment && (
          <p className={formErrorClass} role="alert">
            {errors.acknowledgment}
          </p>
        )}
      </section>
      <div className="flex justify-end border-t border-[var(--color-border)] pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          variant="secondary"
          className="font-mono uppercase tracking-[0.12em]"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
              Saving correction…
            </>
          ) : (
            'Save correction'
          )}
        </Button>
      </div>
    </form>
  );
}
