# Witnss — Agent Build Prompts
## witnss.org | "Because someone was there."
### Documented. Public. Witnessed.

A tiered public domestic violence registry. Search is fully public. Every record
displays its verification tier so users understand what they're looking at.
Built on React + Vite + TypeScript + Tailwind + Appwrite + Netlify Functions.

---

## PROMPT 01 — Project Scaffold

You are scaffolding a new production web application called **Witnss** (witnss.org).

**What it is:** A tiered public domestic violence registry. Search is fully public and requires no account. Every record displays a verification tier badge so users understand the credibility of what they're viewing. The tagline is "Because someone was there." The footnote is "Documented. Public. Witnessed."

**Tech stack:**
- React + Vite + TypeScript
- Tailwind CSS (with custom design tokens)
- Appwrite (database, storage, auth for admin only)
- Netlify Functions (serverless API layer)
- React Router v6

**Scaffold the following structure:**
```
witnss/
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable primitives
│   │   ├── records/          # Record card, tier badge, search result
│   │   ├── search/           # Search bar, filters, results list
│   │   ├── submission/       # Survivor submission portal components
│   │   ├── dispute/          # Dispute flow components
│   │   └── layout/           # Header, footer, page shell
│   ├── pages/
│   │   ├── Home.tsx          # Landing + search
│   │   ├── Search.tsx        # Search results
│   │   ├── Record.tsx        # Individual record detail
│   │   ├── Submit.tsx        # Survivor submission portal
│   │   ├── Dispute.tsx       # Dispute a record
│   │   └── About.tsx         # Mission, legal framework, how tiers work
│   ├── lib/
│   │   ├── appwrite.ts       # Appwrite browser client + admin JWT helper
│   │   ├── types.ts          # All shared TypeScript types
│   │   └── utils.ts          # Formatting, validation helpers
│   ├── hooks/                # Custom React hooks
│   └── styles/
│       └── globals.css       # CSS variables + base styles
├── netlify/
│   └── functions/
│       ├── search.ts
│       ├── record.ts
│       ├── submit.ts
│       └── dispute.ts
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
└── netlify.toml
```

**Define these TypeScript types in `src/lib/types.ts`:**

```typescript
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
  source_type: 'conviction' | 'protective_order' | 'police_report' | 'civil_filing' | 'survivor_submission';
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
```

**Environment variables to scaffold in `.env.example`:**
```
VITE_APPWRITE_ENDPOINT=
VITE_APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
```

Initialize the Appwrite browser client in `src/lib/appwrite.ts` using the Vite env vars. Netlify functions use `APPWRITE_API_KEY` and the same endpoint/project (see `docs/APPWRITE_SETUP.md`).
Set up `netlify.toml` with `[build]` and `[[redirects]]` for SPA routing.
Install all dependencies. Do not build any UI yet — scaffold only.

---

## PROMPT 02 — Supabase Schema + RLS

You are writing the complete Supabase database schema for **Witnss**, a tiered public domestic violence registry.

**Run this SQL in the Supabase SQL editor to create the full schema:**

```sql
-- PERSONS
create table persons (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  name_aliases text[] default '{}',
  dob_approximate text,
  state text not null,
  county text,
  created_at timestamptz default now()
);

-- Enable full-text search on persons
create index persons_name_search on persons using gin(to_tsvector('english', full_name));

-- RECORDS
create table records (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references persons(id) on delete cascade,
  tier smallint not null check (tier in (1, 2, 3)),
  offense_type text not null,
  offense_date date,
  jurisdiction_state text not null,
  jurisdiction_county text,
  source_type text not null,
  source_reference text,
  verified_at timestamptz,
  status text not null default 'active' check (status in ('active', 'disputed', 'under_review', 'removed')),
  created_at timestamptz default now()
);

create index records_person_id on records(person_id);
create index records_status on records(status);
create index records_tier on records(tier);

-- SUBMISSIONS (Tier 3 survivor submissions)
create table submissions (
  id uuid primary key default gen_random_uuid(),
  subject_name text not null,
  subject_state text not null,
  subject_county text,
  incident_type text not null,
  incident_date date,
  jurisdiction_state text not null,
  description text not null,
  supporting_doc_url text,
  submission_hash text, -- sha256 of normalized name+state+incident_type for corroboration
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'corroborated')),
  corroboration_count integer default 1,
  created_at timestamptz default now()
);

-- DISPUTES
create table disputes (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id) on delete cascade,
  submitter_name text not null,
  submitter_contact text not null,
  claim text not null,
  evidence_url text,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'resolved_removed', 'resolved_retained')),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ADMIN USERS (Supabase Auth based — no custom table needed)

-- ROW LEVEL SECURITY

alter table persons enable row level security;
alter table records enable row level security;
alter table submissions enable row level security;
alter table disputes enable row level security;

-- Public can read active records and their persons
create policy "Public read persons" on persons
  for select using (
    exists (
      select 1 from records
      where records.person_id = persons.id
      and records.status = 'active'
    )
  );

create policy "Public read active records" on records
  for select using (status = 'active');

-- Submissions: public insert only, no public read (admin only)
create policy "Public insert submissions" on submissions
  for insert with check (true);

-- Disputes: public insert only, no public read
create policy "Public insert disputes" on disputes
  for insert with check (true);

-- Admin full access (authenticated users with service role)
create policy "Admin full access persons" on persons
  for all using (auth.role() = 'service_role');

create policy "Admin full access records" on records
  for all using (auth.role() = 'service_role');

create policy "Admin full access submissions" on submissions
  for all using (auth.role() = 'service_role');

create policy "Admin full access disputes" on disputes
  for all using (auth.role() = 'service_role');
```

**Also create this Supabase Storage bucket** (Dashboard *or* SQL below):
- Bucket name: `evidence`
- Public: false
- Max file size: 10MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

**Storage bucket + object policies (SQL):** run after schema. Adjust if your project already has an `evidence` bucket.

```sql
-- Evidence bucket (private uploads for disputes / submission docs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only service role manages evidence objects (admin / server). Anon cannot list or read.
drop policy if exists "Service role full access to evidence objects" on storage.objects;
create policy "Service role full access to evidence objects"
  on storage.objects for all
  using (bucket_id = 'evidence' and auth.role() = 'service_role')
  with check (bucket_id = 'evidence' and auth.role() = 'service_role');
```

If `storage.objects` already has policies, drop conflicting ones or merge with your conventions. Public forms that upload files should use a **signed upload URL** or **Edge Function** with service role — not broad anon `insert` on `evidence`.

**Seed 5 fake test records** using realistic but entirely fictional data — made-up names, real state/county names, realistic offense types. Mix across all 3 tiers. Use the SQL insert pattern. Clearly comment them as `-- TEST DATA`.

**Also seed (optional but useful for dev):**
- **Submissions:** a few Tier-3-queue rows (include two rows sharing the same `submission_hash` to exercise corroboration).
- **Disputes:** one pending dispute tied to a fixed `record_id` so the admin dispute UI can be tested.

Run after schema exists (SQL editor runs as superuser; bypasses RLS). Re-running: delete in FK order (`disputes` → `records` → `persons` for these IDs, and test `submissions`) or use the optional reset block at the top.

```sql
-- TEST DATA — entirely fictional; local/staging only
-- Optional reset (uncomment if re-seeding):
-- delete from disputes where id = 'd1d1d1d1-d1d1-4d01-d001-000000000001';
-- delete from records where id in (
--   'b1b2c3d4-e5f6-4a01-b001-000000000001','b1b2c3d4-e5f6-4a01-b002-000000000002',
--   'b1b2c3d4-e5f6-4a01-b003-000000000003','b1b2c3d4-e5f6-4a01-b004-000000000004',
--   'b1b2c3d4-e5f6-4a01-b005-000000000005');
-- delete from persons where id in (
--   'a1b2c3d4-e5f6-4a01-a001-000000000001','a1b2c3d4-e5f6-4a01-a002-000000000002',
--   'a1b2c3d4-e5f6-4a01-a003-000000000003','a1b2c3d4-e5f6-4a01-a004-000000000004',
--   'a1b2c3d4-e5f6-4a01-a005-000000000005');
-- delete from submissions where submission_hash in ('witnss_seed_hash_renata_01', 'witnss_seed_hash_marcus_fake');

-- PERSONS + RECORDS (5 records, tiers 1–3)
insert into persons (id, full_name, name_aliases, dob_approximate, state, county) values
  ('a1b2c3d4-e5f6-4a01-a001-000000000001', 'Eleanor Voss', array['E. Voss', 'Ellie Voss'], '1979', 'Texas', 'Harris County'),
  ('a1b2c3d4-e5f6-4a01-a002-000000000002', 'Jameson Okonkwo', array['J. Okonkwo'], '1988', 'California', 'Los Angeles County'),
  ('a1b2c3d4-e5f6-4a01-a003-000000000003', 'Priya Menon', array[]::text[], '1991', 'Florida', 'Miami-Dade County'),
  ('a1b2c3d4-e5f6-4a01-a004-000000000004', 'Theodore Blaylock', array['Ted Blaylock'], '1984', 'New York', 'Kings County'),
  ('a1b2c3d4-e5f6-4a01-a005-000000000005', 'Renata Kowalski', array['R. Kowalski'], '1995', 'Illinois', 'Cook County');

insert into records (
  id, person_id, tier, offense_type, offense_date, jurisdiction_state, jurisdiction_county,
  source_type, source_reference, verified_at, status
) values
  ('b1b2c3d4-e5f6-4a01-b001-000000000001', 'a1b2c3d4-e5f6-4a01-a001-000000000001', 1, 'Domestic assault (misdemeanor)', '2019-03-14',
   'Texas', 'Harris County', 'court',
   'Cause No. 2019-CR-FICTION (fictional docket)', '2019-06-01 12:00:00+00', 'active'),
  ('b1b2c3d4-e5f6-4a01-b002-000000000002', 'a1b2c3d4-e5f6-4a01-a002-000000000002', 1, 'Violation of protective order', '2021-11-02',
   'California', 'Los Angeles County', 'court',
   'Final restraining order — fictional case BC-FAKE-4421', '2021-12-15 09:00:00+00', 'active'),
  ('b1b2c3d4-e5f6-4a01-b003-000000000003', 'a1b2c3d4-e5f6-4a01-a003-000000000003', 2, 'Domestic battery', '2022-08-20',
   'Florida', 'Miami-Dade County', 'police_report',
   'Fictional incident report MD-22-FAKE-8834', null, 'active'),
  ('b1b2c3d4-e5f6-4a01-b004-000000000004', 'a1b2c3d4-e5f6-4a01-a004-000000000004', 2, 'Criminal mischief (domestic)', '2020-01-09',
   'New York', 'Kings County', 'arrest_record',
   'Fictional booking ref NYPD-FAKE-7721', null, 'active'),
  ('b1b2c3d4-e5f6-4a01-b005-000000000005', 'a1b2c3d4-e5f6-4a01-a005-000000000005', 3, 'Stalking and harassment', '2023-05-01',
   'Illinois', 'Cook County', 'community_submission',
   'Aggregated survivor submissions (test seed — not real)', null, 'active');

-- SUBMISSIONS (Tier 3 intake + corroboration demo: same hash twice)
insert into submissions (
  subject_name, subject_state, subject_county, incident_type, incident_date,
  jurisdiction_state, description, supporting_doc_url, submission_hash, review_status, corroboration_count
) values
  (
    'Renata Kowalski', 'Illinois', 'Cook County', 'Stalking and harassment', '2023-04-15',
    'Illinois',
    'TEST DATA — Fictional: reported pattern of unwanted contact and threats. Not a real incident.',
    null,
    'witnss_seed_hash_renata_01',
    'pending',
    1
  ),
  (
    'Renata Kowalski', 'Illinois', 'Cook County', 'Stalking and harassment', '2023-05-20',
    'Illinois',
    'TEST DATA — Fictional second submitter; same normalized key as row above for corroboration UI.',
    null,
    'witnss_seed_hash_renata_01',
    'corroborated',
    2
  ),
  (
    'Marcus Thibeault', 'Ohio', 'Franklin County', 'Domestic assault', '2024-01-10',
    'Ohio',
    'TEST DATA — Fictional standalone submission still pending review.',
    null,
    'witnss_seed_hash_marcus_fake',
    'pending',
    1
  );

-- DISPUTE (linked to Eleanor Voss record — test dispute workflow)
insert into disputes (
  id, record_id, submitter_name, submitter_contact, claim, evidence_url, status
) values (
  'd1d1d1d1-d1d1-4d01-d001-000000000001',
  'b1b2c3d4-e5f6-4a01-b001-000000000001',
  'Jordan Ellis',
  'jordan.ellis.fake@example.test',
  'TEST DATA — Fictional: claim that this record describes a different person with a similar name. For dispute UI testing only.',
  null,
  'pending'
);
```

---

## PROMPT 03 — Design System + Brand Identity

You are building the design system for **Witnss** (witnss.org), a public domestic violence registry.

**Brand:**
- Name: Witnss
- Tagline: "Because someone was there."
- Footnote: "Documented. Public. Witnessed."
- Mission: Survivor-centered accountability. Not punitive — testimonial. Bearing witness to documented judicial outcomes and survivor accounts.

**Aesthetic direction:**
Dark, editorial, authoritative. Think legal archive meets investigative journalism — not clinical, not aggressive. Think the *New York Times* investigations desk crossed with a civil rights archive. Stark. Serious. Trustworthy. The UI should feel like it was built by people who care about survivors, not by people who want to shame anyone.

**Color palette — define as CSS variables in `src/styles/globals.css`:**
```css
:root {
  --color-bg: #0e0e0e;           /* Near black — primary background */
  --color-surface: #161616;      /* Elevated surfaces */
  --color-surface-2: #1f1f1f;    /* Cards, inputs */
  --color-border: #2a2a2a;       /* Subtle borders */
  --color-border-strong: #3a3a3a;

  --color-text-primary: #f0ece4;  /* Warm white — not harsh */
  --color-text-secondary: #9e9a94;
  --color-text-muted: #5a5652;

  /* Tier badge colors */
  --color-tier-1: #4ade80;       /* Green — verified/conviction */
  --color-tier-2: #facc15;       /* Amber — documented */
  --color-tier-3: #f97316;       /* Orange — reported */

  --color-accent: #e05a5a;       /* Muted red — used sparingly */
  --color-accent-hover: #c94a4a;

  --color-dispute: #60a5fa;      /* Blue — dispute/info actions */

  /* Typography scale */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Load these fonts from Google Fonts in `index.html`:**
- Playfair Display (700, 900)
- DM Sans (400, 500)
- JetBrains Mono (400)

**Build these reusable UI primitives in `src/components/ui/`:**

1. **`TierBadge.tsx`** — Displays tier with appropriate color, icon, and label:
   - Tier 1: Green dot + "Verified Record" — tooltip: "Sourced from court conviction or final protective order"
   - Tier 2: Amber dot + "Documented" — tooltip: "Sourced from police report, arrest record, or civil filing"
   - Tier 3: Orange dot + "Community Reported" — tooltip: "Submitted by survivors. Unverified. Two or more independent submissions."

2. **`OffenseBadge.tsx`** — Pill label for offense type. Maps internal keys to readable labels (e.g. `domestic_assault` → "Domestic Assault")

3. **`Button.tsx`** — Variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`.

4. **`Input.tsx`** — Styled text input with label, error state, helper text.

5. **`Card.tsx`** — Surface container with optional border and padding variants.

6. **`Spinner.tsx`** — Loading indicator.

7. **`Alert.tsx`** — Variants: `info`, `warning`, `error`. Used for legal disclaimers and form feedback.

**Also build `src/components/layout/PageShell.tsx`:**
- Fixed header with Witnss wordmark (Playfair Display, --color-text-primary)
- Tagline in header: "Because someone was there." in --font-body, --color-text-secondary
- Navigation links: Search | Submit a Record | Dispute a Record | About
- Footer: "Documented. Public. Witnessed." + legal disclaimer: "Witnss displays public records and community-reported accounts. All Tier 3 entries are user-submitted and unverified. This platform is not a law enforcement agency."
- Mobile responsive

---

## PROMPT 04 — Public Search UI

You are building the public search interface for **Witnss**, a tiered domestic violence registry. The design system, types, and Supabase schema are already in place.

**Page: `src/pages/Search.tsx` + `src/pages/Home.tsx`**

**Home.tsx** is the landing page. It should:
- Display the Witnss wordmark large in Playfair Display
- Display the tagline "Because someone was there." prominently
- Render the search bar centered on screen, immediately usable
- Below the search bar, show a subtle legal disclaimer
- Show a brief 3-column "How it works" section explaining the three tiers
- Navigating to /search?q=... should trigger the search

**Search.tsx** is the results page. It should:
- Retain the search bar at top with current query populated
- Show filter controls: State (dropdown), Tier (multi-checkbox), Offense Type (multi-checkbox)
- Show result count: "X records found for [query]"
- Render a list of `RecordCard` components
- Handle empty state: "No records found. If you have information about this person, you can submit a report."
- Handle loading state with skeleton cards

**Build `src/components/records/RecordCard.tsx`:**
Each card displays:
- Subject full name (Playfair Display, large)
- State + County
- Approximate age / decade if available
- `TierBadge` — prominent, top right of card
- `OffenseBadge` for each offense type on the record
- Offense date (year only for Tier 3)
- Source type label (e.g. "Court Conviction", "Final Protective Order", "Survivor Submission")
- Link to full record detail page
- A small "Dispute this record" link in muted text at the bottom

**Important UX rules:**
- Never display home addresses
- Never display exact date of birth — approximate decade only
- Source reference (case numbers) display on full record detail page, not on card
- Tier 3 cards must display a clear disclaimer: "This record was submitted by community members and has not been independently verified."

**Build the Netlify Function `netlify/functions/search.ts`:**
- Accepts query params: `q`, `state`, `tier`, `offense_type`
- Uses Supabase service role key (server-side only)
- Full-text searches `persons.full_name` and also checks `name_aliases`
- Joins with `records` filtered to `status = 'active'`
- Returns persons with their active records nested
- Paginates at 20 results per page

---

## PROMPT 05 — Survivor Submission Portal

You are building the survivor submission portal for **Witnss**, a tiered domestic violence registry. This is how Tier 3 community-reported records enter the system.

**Page: `src/pages/Submit.tsx`**

This page must lead with **safety and care**. The first thing a visitor sees is not a form — it's a support message and safety notice.

**Safety banner (always visible at top):**
> "If you are in immediate danger, call 911. National DV Hotline: 1-800-799-7233 (TTY: 1-800-787-3224). Chat: thehotline.org"

**Intro copy (before the form):**
Brief, warm, direct. Something like: "You can submit an account of abuse you experienced or witnessed. Your submission is anonymous by default. If two or more independent submissions match, the record may be elevated for review. Submitting false information is a violation of our terms."

**The form itself — `src/components/submission/SubmissionForm.tsx`:**

Fields:
- Subject's full name (required)
- Known aliases (optional, comma-separated)
- Subject's state (required, dropdown)
- Subject's county (optional)
- Incident type (required, maps to OffenseType enum — human-readable labels)
- Approximate incident date (month/year — not required to be exact)
- Description (required, min 100 chars, max 2000) — label: "In your own words, describe what happened."
- Supporting document upload (optional) — accepts PDF, JPG, PNG — max 10MB — label: "Optional: Upload a supporting document (police report, protective order, text messages, etc.)"
- Anonymous toggle (default: on) — when off, shows optional contact email field

**Submission logic in `netlify/functions/submit.ts`:**
- Validates all required fields
- If document uploaded, stores in Supabase Storage `evidence` bucket
- Generates a `submission_hash`: SHA-256 of normalized `(subject_name.toLowerCase().trim() + subject_state + incident_type)`
- Checks for existing submissions with matching hash — if found, increments `corroboration_count`
- If `corroboration_count` reaches 2+, flags submission as `corroborated` and triggers an admin review queue entry
- Inserts into `submissions` table
- Returns success with no sensitive data exposed

**Post-submission state:**
- Thank you message: "Your account has been received. If it corroborates an existing submission, it will be reviewed for the record."
- Restate the hotline number
- Do NOT confirm or deny whether a matching record exists

**Important constraints:**
- No CAPTCHA on first version — rate limit by IP at the function level (max 3 submissions per IP per 24h)
- Submissions table is never publicly readable — admin only
- The form should feel like it was designed for someone in a difficult moment: calm, clear, no unnecessary friction

---

## PROMPT 06 — Dispute & Removal Flow

You are building the dispute and removal flow for **Witnss**, a public domestic violence registry. This flow is how a listed person can contest their record. It is a legal necessity and must be taken seriously in both UX and implementation.

**Page: `src/pages/Dispute.tsx`**

This page is accessed two ways:
1. From a record card/detail ("Dispute this record" link — passes `recordId` as query param)
2. Directly via /dispute

**Lead copy — firm but fair:**
> "If you believe a record about you is inaccurate, you may submit a dispute. Disputes are reviewed manually. Records sourced from public court documents will only be removed if you provide documentation that the record is factually incorrect (e.g., expungement order, case dismissal). Tier 3 community-reported records may be removed with appropriate evidence of misidentification or factual error."

**The dispute form — `src/components/dispute/DisputeForm.tsx`:**

Fields:
- Record ID (pre-filled if coming from a record, otherwise text input)
- Your full name (required)
- Contact email (required — needed to follow up)
- Nature of dispute (required, dropdown):
  - "This record is not about me (misidentification)"
  - "This conviction/order has been expunged or vacated"
  - "The details of this record are factually incorrect"
  - "This is a Tier 3 submission and it is false"
  - "Other"
- Detailed explanation (required, min 100 chars)
- Supporting documentation upload (optional for Tier 3, strongly recommended for Tier 1/2) — PDF/image, max 10MB
- Acknowledgment checkbox: "I understand that submitting a false dispute is a violation of Witnss terms of use."

**Dispute function `netlify/functions/dispute.ts`:**
- Validates all fields
- Uploads evidence doc to Supabase Storage `evidence` bucket if provided
- Inserts into `disputes` table
- Updates the corresponding `records` row status to `'disputed'`
- Returns success

**Post-submission state:**
- Confirmation: "Your dispute has been received and will be reviewed within 14 business days. You will receive a response at the email you provided."
- The disputed record remains visible but gains a "Dispute Pending" label while under review

**Dispute status display on Record Detail page:**
- If `record.status === 'disputed'` — show amber banner: "A dispute has been filed for this record and is currently under review."
- If `record.status === 'under_review'` — show same banner
- If `record.status === 'removed'` — record does not appear in search or direct URL (404)

---

## PROMPT 07 — Admin Panel

You are building the internal admin panel for **Witnss**. This panel is gated behind Supabase Auth. It is never linked publicly. It is accessed at `/admin`.

**Auth:**
- Use Supabase Auth email/password
- `src/pages/admin/AdminLogin.tsx` — simple login form
- Wrap all admin routes in an `AdminGuard` component that checks session
- On logout, redirect to public home

**Admin pages (all under `/admin/*`):**

**`/admin` — Dashboard**
- Summary counts: Total active records, Pending submissions, Open disputes, Records under review
- Recent activity feed: last 10 submissions, last 10 disputes (timestamp + subject name + type)

**`/admin/submissions` — Submission Review Queue**
- Table of all submissions with `review_status = 'pending'` or `'corroborated'`
- Columns: Subject name, State, Incident type, Submitted at, Corroboration count, Has document
- Corroborated submissions (count ≥ 2) highlighted in amber
- Row actions:
  - **Approve → Tier 3 Record**: Creates a new `persons` row + `records` row at tier 3. Sets submission to `approved`.
  - **Reject**: Sets submission to `rejected`. No record created.
  - **View document**: Opens evidence file from Supabase Storage

**`/admin/disputes` — Dispute Review Queue**
- Table of all disputes with `status = 'pending'` or `'under_review'`
- Columns: Record ID, Subject name, Dispute type, Submitted at, Has evidence
- Row actions:
  - **Mark Under Review**: Sets dispute status to `under_review`, sends no email (v1)
  - **Resolve — Remove Record**: Sets dispute to `resolved_removed`, sets record status to `removed`
  - **Resolve — Retain Record**: Sets dispute to `resolved_retained`, sets record status back to `active`
  - **View evidence**: Opens evidence file

**`/admin/records` — Record Management**
- Searchable table of all records (all statuses)
- Can manually add Tier 1 or Tier 2 records (form: person details + record details)
- Can edit status of any record
- Can soft-delete (set status to `removed`) any record

**Technical requirements:**
- All admin data fetches use the Supabase service role key via Netlify Functions — never expose service role key to client
- Admin functions are separate from public functions: `netlify/functions/admin-*.ts`
- Each admin function checks for a valid Supabase session token in the Authorization header before executing
- The admin panel does not need to be beautiful — clean, functional, data-dense is correct

---

## PROMPT 08 — About Page + Legal Copy

You are writing and building the About page for **Witnss** (witnss.org), a public domestic violence registry.

**Page: `src/pages/About.tsx`**

This page should be editorial in feel — long-form, serious, well-typeset. Think investigative journalism methodology page crossed with a civil rights organization's mission statement.

**Sections to build:**

**1. Mission**
Write copy that:
- Frames Witnss as a testimonial platform, not a punitive one
- Centers survivor voice and public safety
- Explicitly states Witnss is not a law enforcement agency and does not make legal determinations
- Names the gap it fills: conviction rates for DV are low; most abuse never reaches a verdict; survivors deserve a record

**2. How the Tiers Work**
Detailed plain-language explanation of all three tiers:
- Tier 1 Verified: What qualifies, how it's sourced, what "verified" means
- Tier 2 Documented: What qualifies, the distinction from conviction
- Tier 3 Community Reported: How corroboration works, what the two-submission threshold means, why it matters legally, explicit statement that these are unverified

**3. Our Standards**
- What we will never publish (home addresses, exact DOBs, unverified single allegations)
- Data minimization commitment
- No advertising, no data sales

**4. Dispute Process**
Plain-language walkthrough of how to dispute a record. Link to /dispute.

**5. Legal Framework**
Plain-language explanation of:
- Why conviction-only sourcing protects due process
- Why Tier 3 operates under Section 230
- That listed persons have a dispute pathway
- Jurisdiction note (US only, MVP)

**6. Contact & Coalition**
Placeholder section for DV org partnerships and press inquiries.
Contact email: team@witnss.org (placeholder)

**Design notes:**
- This page should be the most typographically rich in the app
- Use Playfair Display for section headers, DM Sans for body
- Pull quotes in large type for key mission statements
- Generous line height and measure for readability
- Mobile readable

---
*Witnss — witnss.org*
*"Because someone was there."*
*Documented. Public. Witnessed.*
