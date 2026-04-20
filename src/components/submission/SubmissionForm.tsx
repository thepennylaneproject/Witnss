import { useState, useId } from 'react';
import type { OffenseType } from '../../lib/types';
import { OFFENSE_TYPE_LABELS } from '../../lib/types';
import { US_STATES, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../../lib/constants';
import { Button, Input } from '../ui';
import { cn } from '../../lib/utils';
import { ledgerCheckboxClass, ledgerFieldClass, ledgerFieldErrorClass, ledgerFileInputClass } from '../../lib/fieldStyles';

const OFFENSE_OPTIONS: OffenseType[] = [
  'domestic_assault',
  'domestic_battery',
  'strangulation',
  'stalking',
  'harassment',
  'sexual_assault',
  'child_endangerment',
  'violation_of_protective_order',
  'other',
];

const DESC_MIN = 100;
const DESC_MAX = 2000;
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

export interface SubmissionFormPayload {
  subject_name: string;
  subject_aliases: string;
  subject_state: string;
  subject_county: string;
  incident_type: OffenseType;
  incident_date: string; // YYYY-MM or ''
  description: string;
  anonymous: boolean;
  contact_email: string;
  document?: File;
}

export interface SubmissionFormProps {
  onSubmit: (payload: SubmissionFormPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function SubmissionForm({ onSubmit, isSubmitting = false }: SubmissionFormProps) {
  const [subjectName, setSubjectName] = useState('');
  const [aliases, setAliases] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [incidentType, setIncidentType] = useState<OffenseType | ''>('');
  const [incidentDate, setIncidentDate] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const fileInputId = useId();

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!subjectName.trim()) next.subject_name = 'When you’re ready, add a name so we can match this to the right file.';
    if (!state) next.subject_state = 'We need a state to continue—choose one if you can.';
    if (!incidentType) next.incident_type = 'Choose the category that fits best; you can explain more below.';
    if (description.length < DESC_MIN) {
      next.description = `A bit more detail helps (${DESC_MIN} characters minimum). Take your time.`;
    }
    if (description.length > DESC_MAX) next.description = `This section can be up to ${DESC_MAX} characters.`;
    if (!anonymous && contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) next.contact_email = 'That email doesn’t look quite right—check for typos?';
    }
    if (document) {
      if (document.size > MAX_FILE_SIZE_BYTES) next.document = 'Files need to be 10MB or smaller.';
      const allowed = [...ALLOWED_FILE_TYPES];
      if (!allowed.includes(document.type as typeof allowed[number]) && document.type !== 'image/jpeg') {
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
      subject_name: subjectName.trim(),
      subject_aliases: aliases.trim(),
      subject_state: state,
      subject_county: county.trim(),
      incident_type: incidentType as OffenseType,
      incident_date: incidentDate,
      description: description.trim(),
      anonymous,
      contact_email: anonymous ? '' : contactEmail.trim(),
      document: document ?? undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
        Write this like a journal note: what happened, where it happened, and what details you
        remember. Clear, plain language is enough.
      </p>
      <section className="space-y-5">
        <p className={recordSectionTitleClass}>About the person you’re naming</p>
        <Input
          label={<span className={recordLabelClass}>Name</span>}
          name="subject_name"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="Full name, if known"
          required
          error={errors.subject_name}
          autoComplete="off"
          className={typewriterInputClass}
        />
        <Input
          label={<span className={recordLabelClass}>Other names (optional)</span>}
          name="subject_aliases"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="Nickname, maiden name, or alternate spelling"
          helperText="e.g. Nickname, maiden name"
          autoComplete="off"
          className={typewriterInputClass}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="subject_state"
              className={recordLabelClass}
            >
              State <span className={requiredMarkClass}>*</span>
            </label>
            <select
              id="subject_state"
              name="subject_state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              aria-invalid={!!errors.subject_state}
              className={cn(
                typewriterSelectClass,
                errors.subject_state && ledgerFieldErrorClass,
              )}
            >
              <option value="">Select state</option>
              {US_STATES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.subject_state && (
              <p className={formErrorClass} role="alert">
                {errors.subject_state}
              </p>
            )}
          </div>
          <Input
            label={<span className={recordLabelClass}>County (optional)</span>}
            name="subject_county"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="County, if known"
            autoComplete="off"
            className={typewriterInputClass}
          />
        </div>
      </section>

      <section className="space-y-5 border-t border-[var(--color-border)] pt-6">
        <p className={recordSectionTitleClass}>What happened</p>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="incident_type"
            className={recordLabelClass}
          >
            Incident category <span className={requiredMarkClass}>*</span>
          </label>
          <select
            id="incident_type"
            name="incident_type"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value as OffenseType | '')}
            required
            aria-invalid={!!errors.incident_type}
            className={cn(
              typewriterSelectClass,
              errors.incident_type && ledgerFieldErrorClass,
            )}
          >
            <option value="">Choose a category</option>
            {OFFENSE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {OFFENSE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
          {errors.incident_type && (
            <p className={formErrorClass} role="alert">
              {errors.incident_type}
            </p>
          )}
        </div>
        <Input
          label={<span className={recordLabelClass}>Approximate date (optional)</span>}
          name="incident_date"
          type="month"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
          helperText="Month/year is enough if the exact date is unclear."
          className={typewriterInputClass}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="description"
            className={recordLabelClass}
          >
            Your words <span className={requiredMarkClass}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={DESC_MIN}
            maxLength={DESC_MAX}
            rows={6}
            aria-invalid={!!errors.description}
            className={cn(
              typewriterSelectClass,
              'resize-y',
              errors.description && ledgerFieldErrorClass,
            )}
            placeholder="Write the sequence in your own words. Add place, timing, and context where you can."
          />
          <p className={formHintClass}>
            {description.length} / {DESC_MAX} — at least {DESC_MIN} characters
          </p>
          {errors.description && (
            <p className={formErrorClass} role="alert">
              {errors.description}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-5 border-t border-[var(--color-border)] pt-6">
        <p className={recordSectionTitleClass}>Optional supporting files</p>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={fileInputId}
            className={recordLabelClass}
          >
            Attach file (optional)
          </label>
          <input
            id={fileInputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
            className={typewriterFileClass}
          />
          {document && (
            <p className={formHintClass}>
              {document.name} ({(document.size / 1024).toFixed(1)} KB). Max 10MB. PDF, JPG, or PNG.
            </p>
          )}
          {errors.document && (
            <p className={formErrorClass} role="alert">
              {errors.document}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4 border-t border-[var(--color-border)] pt-6">
        <p className={recordSectionTitleClass}>Privacy</p>
        <div className="flex items-center gap-3">
          <input
            id="anonymous"
            type="checkbox"
            name="anonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className={ledgerCheckboxClass}
          />
          <label htmlFor="anonymous" className="text-sm leading-relaxed text-[var(--color-text-primary)]">
            Keep my name off this submission (you can change this anytime before saving)
          </label>
        </div>
        {!anonymous && (
          <Input
            label={<span className={recordLabelClass}>Contact email (optional)</span>}
            name="contact_email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Only if you want follow-up from the review team"
            error={errors.contact_email}
            autoComplete="email"
            className={typewriterInputClass}
          />
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
              Saving entry…
            </>
          ) : (
            'Save entry'
          )}
        </Button>
      </div>
    </form>
  );
}
