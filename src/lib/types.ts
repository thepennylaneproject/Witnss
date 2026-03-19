export type RecordTier = 1 | 2 | 3;

export type OffenseType =
  | 'domestic_assault'
  | 'domestic_battery'
  | 'strangulation'
  | 'stalking'
  | 'harassment'
  | 'sexual_assault'
  | 'child_endangerment'
  | 'violation_of_protective_order'
  | 'other';

export type RecordStatus = 'active' | 'disputed' | 'under_review' | 'removed';

export interface Person {
  id: string;
  full_name: string;
  name_aliases: string[];
  dob_approximate: string | null; // "1985" or "mid-1980s" — never exact DOB
  state: string;
  county: string | null;
  created_at: string;
}

export interface Record {
  id: string;
  person_id: string;
  person?: Person;
  tier: RecordTier;
  offense_type: OffenseType;
  offense_date: string | null;
  jurisdiction_state: string;
  jurisdiction_county: string | null;
  source_type:
    | 'conviction'
    | 'protective_order'
    | 'police_report'
    | 'civil_filing'
    | 'survivor_submission';
  source_reference: string | null; // Case number, docket, etc.
  verified_at: string | null;
  status: RecordStatus;
  created_at: string;
}

export interface Submission {
  id: string;
  subject_name: string;
  subject_state: string;
  subject_county: string | null;
  incident_type: OffenseType;
  incident_date: string | null;
  jurisdiction_state: string;
  description: string;
  supporting_doc_url: string | null;
  submission_hash: string; // For corroboration matching
  created_at: string;
}

/** Nature of dispute (form dropdown). Stored in claim with explanation. */
export type DisputeNature =
  | 'misidentification'
  | 'expunged_or_vacated'
  | 'factually_incorrect'
  | 'tier3_false'
  | 'other';

export interface Dispute {
  id: string;
  record_id: string;
  submitter_name: string;
  submitter_contact: string;
  claim: string;
  evidence_url: string | null;
  status: 'pending' | 'under_review' | 'resolved_removed' | 'resolved_retained';
  reviewed_at: string | null;
  created_at: string;
}

export interface SearchFilters {
  query: string;
  state?: string;
  tier?: RecordTier[];
  offense_type?: OffenseType[];
}

/** Person with nested active records — API search response shape */
export interface SearchResult {
  person: Person;
  records: Record[];
}

/** Source type display labels for UI */
export const SOURCE_TYPE_LABELS: {
  [K in Record['source_type']]: string;
} = {
  conviction: 'Court Conviction',
  protective_order: 'Final Protective Order',
  police_report: 'Police Report',
  civil_filing: 'Civil Filing',
  survivor_submission: 'Survivor Submission',
};

/** Offense type display labels for submission form and UI */
export const OFFENSE_TYPE_LABELS: Record<OffenseType, string> = {
  domestic_assault: 'Domestic assault',
  domestic_battery: 'Domestic battery',
  strangulation: 'Strangulation',
  stalking: 'Stalking',
  harassment: 'Harassment',
  sexual_assault: 'Sexual assault',
  child_endangerment: 'Child endangerment',
  violation_of_protective_order: 'Violation of protective order',
  other: 'Other',
};
