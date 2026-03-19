import { useState, useId } from 'react';
import type { OffenseType } from '../../lib/types';
import { OFFENSE_TYPE_LABELS } from '../../lib/types';
import { US_STATES, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../../lib/constants';
import { Button, Input, Card } from '../ui';
import { cn } from '../../lib/utils';

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
    if (!subjectName.trim()) next.subject_name = 'Subject\'s full name is required.';
    if (!state) next.subject_state = 'Please select a state.';
    if (!incidentType) next.incident_type = 'Please select an incident type.';
    if (description.length < DESC_MIN) next.description = `Description must be at least ${DESC_MIN} characters.`;
    if (description.length > DESC_MAX) next.description = `Description must be no more than ${DESC_MAX} characters.`;
    if (!anonymous && contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) next.contact_email = 'Please enter a valid email address.';
    }
    if (document) {
      if (document.size > MAX_FILE_SIZE_BYTES) next.document = 'File must be 10MB or smaller.';
      const allowed = [...ALLOWED_FILE_TYPES];
      if (!allowed.includes(document.type as typeof allowed[number]) && document.type !== 'image/jpeg') {
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
      <Card padding="lg" bordered className="space-y-5">
        <Input
          label="Subject's full name"
          name="subject_name"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="Full legal name"
          required
          error={errors.subject_name}
          autoComplete="off"
        />
        <Input
          label="Known aliases (optional)"
          name="subject_aliases"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="Comma-separated nicknames or other names"
          helperText="e.g. Nickname, maiden name"
          autoComplete="off"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="subject_state"
              className="text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Subject's state <span className="text-[var(--color-accent)]">*</span>
            </label>
            <select
              id="subject_state"
              name="subject_state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              aria-invalid={!!errors.subject_state}
              className={cn(
                'w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] transition-colors',
                'border-[var(--color-border)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]',
                errors.subject_state && 'border-[var(--color-accent)]',
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
              <p className="text-sm text-[var(--color-accent)]" role="alert">
                {errors.subject_state}
              </p>
            )}
          </div>
          <Input
            label="County (optional)"
            name="subject_county"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="County if known"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="incident_type"
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Incident type <span className="text-[var(--color-accent)]">*</span>
          </label>
          <select
            id="incident_type"
            name="incident_type"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value as OffenseType | '')}
            required
            aria-invalid={!!errors.incident_type}
            className={cn(
              'w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] transition-colors',
              'border-[var(--color-border)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]',
              errors.incident_type && 'border-[var(--color-accent)]',
            )}
          >
            <option value="">Select type</option>
            {OFFENSE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {OFFENSE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
          {errors.incident_type && (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {errors.incident_type}
            </p>
          )}
        </div>
        <Input
          label="Approximate incident date (optional)"
          name="incident_date"
          type="month"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
          helperText="Month and year are enough if you're not sure of the exact date."
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="description"
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            In your own words, describe what happened. <span className="text-[var(--color-accent)]">*</span>
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
              'w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors resize-y',
              'border-[var(--color-border)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]',
              errors.description && 'border-[var(--color-accent)]',
            )}
            placeholder="Include what happened, when and where you can, and any relevant details."
          />
          <p className="text-sm text-[var(--color-text-muted)]">
            {description.length} / {DESC_MAX} characters (minimum {DESC_MIN})
          </p>
          {errors.description && (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {errors.description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={fileInputId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Optional: Upload a supporting document (police report, protective order, text messages, etc.)
          </label>
          <input
            id={fileInputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-2 file:text-[var(--color-text-primary)]"
          />
          {document && (
            <p className="text-sm text-[var(--color-text-muted)]">
              {document.name} ({(document.size / 1024).toFixed(1)} KB). Max 10MB. PDF, JPG, or PNG.
            </p>
          )}
          {errors.document && (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {errors.document}
            </p>
          )}
        </div>
        <div className="space-y-4 border-t border-[var(--color-border)] pt-5">
          <div className="flex items-center gap-3">
            <input
              id="anonymous"
              type="checkbox"
              name="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-dispute)] focus:ring-[var(--color-dispute)]"
            />
            <label htmlFor="anonymous" className="text-sm font-medium text-[var(--color-text-primary)]">
              Submit anonymously (recommended)
            </label>
          </div>
          {!anonymous && (
            <Input
              label="Contact email (optional)"
              name="contact_email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Only if you're willing to be contacted about this submission"
              error={errors.contact_email}
              autoComplete="email"
            />
          )}
        </div>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
              Submitting…
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </div>
    </form>
  );
}
