# Witnss — Comprehensive Codebase Intelligence Audit

> Produced from direct analysis of the repository at `thepennylaneproject/Witnss`.
> All findings are sourced from actual files. Inferred items are explicitly flagged `[INFERRED]`.

---

## SECTION 1: PROJECT IDENTITY

### Project Name
`witnss` — as defined in `package.json`. Displayed throughout the UI as **Witnss**.

### Repository URL
`https://github.com/thepennylaneproject/Witnss` — inferred from GitHub remote context. Not declared in any config file. `[INFERRED]`

### One-Line Description
No `description` field in `package.json`. The tagline pulled from the UI:

> **"Because someone was there."** — `src/pages/Home.tsx`, `src/components/layout/PageShell.tsx`

Cleaner version: *A survivor-centered public registry for domestic violence and abuse records, organized by evidence tier.*

### Project Status
**Alpha** — Core features (search, submission, dispute, admin review) are architecturally complete and end-to-end functional. The codebase has 2 commits, no test coverage, an empty README, and several documented placeholder directories (`hooks/`, `search/`). The in-memory rate limiter carries a code comment explicitly flagging it as not production-ready.

### Commit History
| | |
|---|---|
| **First commit date** | 2026-03-19 19:52:20 −0500 |
| **Most recent commit date** | 2026-03-20 20:00:09 +0000 |
| **Total commits** | 2 |

### Deployment Status
**Configured for deployment.** `netlify.toml` is present and defines the full build pipeline. The Appwrite endpoint hardcoded as the default in `src/lib/appwrite.ts` (`https://nyc.cloud.appwrite.io/v1`) and the project ID (`69bba04d0033f1c4e2e4`) confirm a live Appwrite Cloud instance exists. Whether the Netlify site is actively published cannot be determined from the repo alone. `[INFERRED: likely deployed to Netlify, not confirmed live]`

### Live URL(s)
Not discoverable from the codebase. No `SITE_URL`, `NEXT_PUBLIC_*`, or similar production URL references found.

---

## SECTION 2: TECHNICAL ARCHITECTURE

### Primary Languages & Frameworks

| Layer | Technology | Version |
|---|---|---|
| Frontend language | TypeScript | ~5.6.3 |
| Frontend framework | React | ^18.3.1 |
| Routing | React Router DOM | ^6.28.0 |
| Build tool | Vite | ^5.4.11 |
| Styling | Tailwind CSS | ^3.4.16 |
| Backend runtime | Netlify Functions (Node.js) | @netlify/functions ^2.8.2 |
| BaaS | Appwrite Cloud (NYC region) | appwrite ^23.0.0 / node-appwrite ^22.1.3 |

### Full Dependency List

**Core framework**
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | DOM renderer |
| `react-router-dom` | ^6.28.0 | Client-side routing |

**UI / Styling**
| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | ^3.4.16 | Utility-first CSS |
| `autoprefixer` | ^10.4.20 | PostCSS vendor prefixes |
| `postcss` | ^8.4.49 | CSS transformation pipeline |

**State management**
None. React built-in state (`useState`, `useEffect`) only. No Redux, Zustand, Jotai, etc.

**API / Data layer**
| Package | Version | Purpose |
|---|---|---|
| `appwrite` | ^23.0.0 | Browser Appwrite SDK (auth + ping) |
| `node-appwrite` | ^22.1.3 | Server Appwrite SDK for Netlify Functions |
| `busboy` | ^1.6.0 | Multipart form parsing in serverless functions |

**AI / ML integrations**
None. No AI/ML dependencies found anywhere in the codebase.

**Authentication / Authorization**
Handled by Appwrite (email/password sessions). No dedicated auth library.

**Testing**
None. No test runner, no test files found anywhere in the repository.

**Build tooling**
| Package | Version | Purpose |
|---|---|---|
| `vite` | ^5.4.11 | Dev server + production bundler |
| `@vitejs/plugin-react` | ^4.3.4 | Vite React/JSX transform |
| `typescript` | ~5.6.3 | Type checking |
| `@netlify/functions` | ^2.8.2 | Netlify Function type definitions |

**Type definitions**
`@types/react`, `@types/react-dom`, `@types/busboy`

### Project Structure

```
Witnss/
├── src/                        # Frontend React application
│   ├── App.tsx                 # Root router — all route definitions
│   ├── main.tsx                # React entry point + Appwrite ping
│   ├── vite-env.d.ts           # Vite env type declarations
│   ├── components/
│   │   ├── admin/              # AdminGuard (auth gate) + AdminShell (admin nav)
│   │   ├── brand/              # LogoMark component
│   │   ├── dispute/            # DisputeForm component
│   │   ├── layout/             # PageShell (public nav/footer) + PlacardLead
│   │   ├── records/            # RecordCard (search result card)
│   │   ├── search/             # [EMPTY — .gitkeep only]
│   │   ├── submission/         # SubmissionForm component
│   │   └── ui/                 # Shared design system: Alert, Button, Card,
│   │                           #   Input, OffenseBadge, Spinner, TierBadge
│   ├── hooks/                  # [EMPTY — .gitkeep only]
│   ├── lib/
│   │   ├── appwrite.ts         # Appwrite client init + JWT helper
│   │   ├── constants.ts        # US states array, file type/size limits
│   │   ├── fieldStyles.ts      # Shared Tailwind class strings for form fields
│   │   ├── types.ts            # All TypeScript interfaces and enums
│   │   └── utils.ts            # cn(), formatApproximateDob(), isValidUSStateAbbr()
│   ├── pages/
│   │   ├── About.tsx           # Mission, tiers, legal, contact info
│   │   ├── Dispute.tsx         # Dispute a record page
│   │   ├── Home.tsx            # Search entry + tier explainer
│   │   ├── Record.tsx          # Single record detail view
│   │   ├── Search.tsx          # Full search page with filters + pagination
│   │   ├── Submit.tsx          # Community submission page
│   │   ├── Support.tsx         # Donation page (Stripe + Venmo)
│   │   └── admin/
│   │       ├── AdminDashboard.tsx   # Stats overview
│   │       ├── AdminDisputes.tsx    # Review and resolve disputes
│   │       ├── AdminLogin.tsx       # Email/password login
│   │       ├── AdminRecords.tsx     # Manage verified records
│   │       └── AdminSubmissions.tsx # Review Tier 3 submissions
│   └── styles/
│       └── globals.css         # CSS custom properties (design tokens) + Tailwind base
├── netlify/
│   └── functions/              # Serverless backend (Node.js/TypeScript)
│       ├── _adminAuth.ts       # JWT verification helper (shared)
│       ├── _appwriteServer.ts  # Appwrite server client factory (shared)
│       ├── search.ts           # Public: search records
│       ├── record.ts           # Public: get single record
│       ├── submit.ts           # Public: submit Tier 3 report
│       ├── dispute.ts          # Public: file a dispute
│       ├── admin-stats.ts      # Admin: dashboard statistics
│       ├── admin-submissions.ts # Admin: list + update submissions
│       ├── admin-disputes.ts   # Admin: list + update disputes
│       ├── admin-records.ts    # Admin: create/update/delete records
│       └── admin-signed-url.ts # Admin: serve evidence file bytes
├── public/
│   ├── brand/                  # witnss-eye-on-dark.png, witnss-eye-on-light.png
│   └── favicon.svg
├── docs/
│   ├── LOCAL_DEV.md            # Development setup guide
│   └── APPWRITE_SETUP.md       # Database schema + collection setup guide
├── witnss_logo_pack/           # Brand asset exports (multiple sizes, variants)
├── ATLAS_AGENT_PROMPT.md       # Internal: UI/design agent system prompt
├── ATLAS_AUDIT_PROTOCOL.md     # Internal: design audit framework
├── .env.example                # Environment variable template
├── index.html                  # HTML shell (Google Fonts load here)
├── netlify.toml                # Netlify build + redirect config
├── tailwind.config.ts          # Tailwind theme (maps CSS vars to tokens)
├── tsconfig.json               # TypeScript config (strict mode)
└── vite.config.ts              # Vite config with @/* path alias
```

### Architecture Pattern
**JAMstack / Serverless.** A React SPA hosted on Netlify CDN with all business logic in Netlify Functions (Node.js serverless). No persistent server process. Appwrite Cloud handles the database (NoSQL documents), file storage, and admin authentication.

**Data flow (public):**
1. User loads the SPA from Netlify CDN
2. SPA makes `fetch()` calls to `/.netlify/functions/*`
3. Netlify Function uses `node-appwrite` with a server API key to read/write Appwrite collections
4. Function returns JSON to the SPA
5. SPA renders the result

**Data flow (admin):**
1. Admin logs in via Appwrite email/password session (browser SDK)
2. SPA calls `account.createJWT()` to get a short-lived JWT (max 3600s)
3. Admin API calls include `Authorization: Bearer <jwt>` header
4. Netlify Function verifies the JWT against Appwrite using `account.get()` with the user JWT
5. If valid, function proceeds with server API key operations

### Database / Storage Layer

**Backend:** Appwrite Cloud (NoSQL document store). No SQL, no ORM.

**Database ID:** `main` (configurable via `APPWRITE_DATABASE_ID`)

#### Collection: `persons`
| Field | Type | Required | Notes |
|---|---|---|---|
| `full_name` | String | Yes | |
| `name_aliases` | String | No | JSON array stored as text |
| `dob_approximate` | String | No | e.g. "1985" or "mid-1980s" — never exact DOB |
| `state` | String | Yes | US state abbreviation |
| `county` | String | No | |

#### Collection: `records`
| Field | Type | Required | Notes |
|---|---|---|---|
| `person_id` | String | Yes | References `persons` document ID |
| `tier` | Integer | Yes | 1, 2, or 3 |
| `offense_type` | String | Yes | Enum: domestic_assault, domestic_battery, strangulation, stalking, harassment, sexual_assault, child_endangerment, violation_of_protective_order, other |
| `offense_date` | String | No | ISO or YYYY-MM-DD |
| `jurisdiction_state` | String | Yes | |
| `jurisdiction_county` | String | No | |
| `source_type` | String | Yes | Enum: conviction, protective_order, police_report, civil_filing, survivor_submission |
| `source_reference` | String | No | Case number, docket, etc. |
| `verified_at` | String | No | ISO datetime |
| `status` | String | Yes | Enum: active, disputed, under_review, removed |

#### Collection: `submissions`
| Field | Type | Required | Notes |
|---|---|---|---|
| `subject_name` | String | Yes | |
| `subject_state` | String | Yes | |
| `subject_county` | String | No | |
| `incident_type` | String | Yes | Same offense enum as records |
| `incident_date` | String | No | |
| `jurisdiction_state` | String | Yes | |
| `description` | String | Yes | Minimum 100 chars enforced |
| `supporting_doc_url` | String | No | Appwrite file ID in evidence bucket |
| `submission_hash` | String | Yes | SHA-256 for corroboration matching |
| `review_status` | String | Yes | Enum: pending, corroborated, approved, rejected |
| `corroboration_count` | Integer | Yes | Default 1; increments on corroboration match |

#### Collection: `disputes`
| Field | Type | Required | Notes |
|---|---|---|---|
| `record_id` | String | Yes | References `records` document ID |
| `submitter_name` | String | Yes | |
| `submitter_contact` | String | Yes | Email |
| `claim` | String | Yes | Nature label + explanation combined |
| `evidence_url` | String | No | Appwrite file ID |
| `status` | String | Yes | Enum: pending, under_review, resolved_removed, resolved_retained |
| `reviewed_at` | String | No | ISO datetime |

**Storage bucket:** `evidence` — Stores PDF/JPEG/PNG uploads from submissions and disputes. Server API key access only; no public read.

### API Layer

All endpoints are Netlify serverless functions under `/.netlify/functions/`.

| Path | Method | Purpose | Auth Required |
|---|---|---|---|
| `/search` | GET | Search records by name, state, tier, offense type. Paginated (20/page). Returns `{ results: SearchResult[], total: number }`. | No |
| `/record` | GET | Fetch a single record + person by `?id=`. Returns `{ person, records }`. | No |
| `/submit` | POST | Accept Tier 3 community submission. Multipart form. Rate-limited (3/IP/24h, in-memory). Hashes content for corroboration. | No |
| `/dispute` | POST | Accept a dispute against a record. Multipart form. | No |
| `/admin-stats` | GET | Dashboard: active record count, pending submissions, open disputes, records under review; recent submission/dispute previews. | Yes (JWT) |
| `/admin-submissions` | GET | List pending/corroborated submissions (limit 500). | Yes (JWT) |
| `/admin-submissions` | POST | Update `review_status` on a submission (approve/reject/corroborate). | Yes (JWT) |
| `/admin-disputes` | GET | List pending/under-review disputes with person names. | Yes (JWT) |
| `/admin-disputes` | POST | Update dispute status (resolve_removed/resolve_retained/under_review). | Yes (JWT) |
| `/admin-records` | GET | List/search all records (with person data). | Yes (JWT) |
| `/admin-records` | POST | Create a new person + record. | Yes (JWT) |
| `/admin-records` | PATCH | Update a record's status, tier, or other fields. | Yes (JWT) |
| `/admin-records` | DELETE | Remove a record. | Yes (JWT) |
| `/admin-signed-url` | POST | Serve raw bytes of an evidence file from Appwrite storage. Returns base64-encoded file. | Yes (JWT) |

### External Service Integrations

| Service | What it's used for | Where configured |
|---|---|---|
| **Appwrite Cloud** (nyc.cloud.appwrite.io) | Database (NoSQL documents), file storage, admin authentication | `src/lib/appwrite.ts`, `netlify/functions/_appwriteServer.ts` |
| **Google Fonts** | Loads Bebas Neue, DM Sans, JetBrains Mono, Playfair Display | `index.html` |
| **Stripe** (payment links only) | One-time and monthly donation links. Public URL only — no Stripe SDK, no server-side payment processing. | `src/pages/Support.tsx` via `VITE_STRIPE_DONATION_URL` |
| **Venmo** (deep link) | Donation link (`venmo.com/<username>`) | `src/pages/Support.tsx` via `VITE_VENMO_USERNAME` |

### AI / ML Components
**None.** No AI/ML libraries, APIs, models, or prompts found anywhere in the codebase.

### Authentication & Authorization Model
- **Public users:** No accounts. All public-facing routes are unauthenticated.
- **Admins:** Single user type. Email/password login via Appwrite Account API. Session stored in browser (Appwrite SDK manages cookie/local storage). JWT (3600s max) is minted per request for Netlify Function calls.
- **Permission levels:** Binary — public (unauthenticated) vs. admin (any valid Appwrite session).
- **Admin guard:** `AdminGuard` component checks Appwrite session on mount; redirects to `/admin/login` if unauthenticated.

### Environment Variables

**Browser (Vite — prefixed `VITE_`)**
| Variable | Purpose | Default in code |
|---|---|---|
| `VITE_APPWRITE_ENDPOINT` | Appwrite API endpoint | `https://nyc.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Appwrite project ID | `69bba04d0033f1c4e2e4` |
| `VITE_STRIPE_DONATION_URL` | One-time Stripe payment link | None (optional) |
| `VITE_STRIPE_DONATION_MONTHLY_URL` | Monthly Stripe payment link | None (optional) |
| `VITE_VENMO_USERNAME` | Venmo handle for donation link | None (optional) |

**Server (Netlify Functions only — never exposed to browser)**
| Variable | Purpose | Default in code |
|---|---|---|
| `APPWRITE_API_KEY` | Server API key for Appwrite reads/writes | None (required) |
| `APPWRITE_ENDPOINT` | Override endpoint for functions | Falls back to `VITE_APPWRITE_ENDPOINT` |
| `APPWRITE_PROJECT_ID` | Override project ID for functions | Falls back to `VITE_APPWRITE_PROJECT_ID` |
| `APPWRITE_DATABASE_ID` | Database ID override | `main` |
| `APPWRITE_COLLECTION_PERSONS` | Collection ID override | `persons` |
| `APPWRITE_COLLECTION_RECORDS` | Collection ID override | `records` |
| `APPWRITE_COLLECTION_SUBMISSIONS` | Collection ID override | `submissions` |
| `APPWRITE_COLLECTION_DISPUTES` | Collection ID override | `disputes` |
| `APPWRITE_BUCKET_EVIDENCE` | Storage bucket ID override | `evidence` |

---

## SECTION 3: FEATURE INVENTORY

| Feature | User-Facing Description | Completeness | Key Files |
|---|---|---|---|
| **Home / Search Entry** | Search the registry by name from the homepage. Tier system explained below the search form. | Polished | `src/pages/Home.tsx`, `src/components/layout/PlacardLead.tsx`, `src/components/brand/LogoMark.tsx` |
| **Record Search** | Search by name + optional filters (state, tier 1/2/3, offense type). Paginated at 20 results. Skeleton loading states. | Functional | `src/pages/Search.tsx`, `src/components/records/RecordCard.tsx`, `netlify/functions/search.ts` |
| **Record Detail Page** | View full record for a person, including all their records, source type, dates, and jurisdiction. Link to dispute. | Functional | `src/pages/Record.tsx`, `netlify/functions/record.ts` |
| **Community Submission** | File an anonymous (default) or attributed Tier 3 report. Supports optional document upload (PDF/JPEG/PNG ≤10MB). Rate-limited. Corroboration hashing. | Functional | `src/pages/Submit.tsx`, `src/components/submission/SubmissionForm.tsx`, `netlify/functions/submit.ts` |
| **Dispute a Record** | File a dispute against a record with a reason, explanation, and optional evidence. Pre-fills record ID from URL query param. | Functional | `src/pages/Dispute.tsx`, `src/components/dispute/DisputeForm.tsx`, `netlify/functions/dispute.ts` |
| **About / Mission Page** | Explains Witnss's mission, the tier system, legal limitations, and contact information. | Polished | `src/pages/About.tsx` |
| **Support / Donations** | Donation page with Stripe (one-time and monthly) and Venmo links. Gracefully hidden when unconfigured. | Functional | `src/pages/Support.tsx` |
| **Admin Login** | Appwrite email/password sign-in for admin panel access. Auto-redirects if already authenticated. Graceful degradation if Appwrite is unconfigured. | Functional | `src/pages/admin/AdminLogin.tsx`, `src/components/admin/AdminGuard.tsx` |
| **Admin Dashboard** | Summary stats: active records, pending submissions, open disputes, records under review. Recent submission and dispute previews. | Functional | `src/pages/admin/AdminDashboard.tsx`, `netlify/functions/admin-stats.ts` |
| **Admin Submission Queue** | List pending/corroborated Tier 3 submissions. View supporting documents. Approve, reject, or mark as corroborated. | Functional | `src/pages/admin/AdminSubmissions.tsx`, `netlify/functions/admin-submissions.ts` |
| **Admin Dispute Queue** | List open disputes with linked person names. Update status (under review, resolved). | Functional | `src/pages/admin/AdminDisputes.tsx`, `netlify/functions/admin-disputes.ts` |
| **Admin Records Management** | Search, create, update, and delete records and persons. Inline status changes. | Functional | `src/pages/admin/AdminRecords.tsx`, `netlify/functions/admin-records.ts` |
| **Admin Evidence Viewer** | Serve and display uploaded evidence files (PDF/image) from Appwrite storage through admin UI. | Functional | `netlify/functions/admin-signed-url.ts` |

**Dependencies between features:**
- Search → Record Detail (links from search results)
- Record Detail → Dispute (pre-fills record ID)
- Submission → Admin Submission Queue (admin reviews community reports)
- Admin Submission Queue → Admin Records Management (approved submissions can be promoted to records)
- Dispute → Admin Dispute Queue → Admin Records Management (disputes can trigger status changes or removal)

---

## SECTION 4: DESIGN SYSTEM & BRAND

### Color Palette

All colors are defined as CSS custom properties in `src/styles/globals.css`.

**Night Ledger (dark, primary)**
| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#0c0c0e` | Page background — near black, faintly warm |
| `--color-surface` | `#131315` | Elevated surfaces (cards, panels) |
| `--color-surface-2` | `#1a1a1d` | Form inputs, secondary surfaces |
| `--color-border` | `#2f2f34` | Default borders |
| `--color-border-strong` | `#3a3a40` | Focused/active borders |
| `--color-ledger-muted` | `#4f4b47` | Muted ledger elements |
| `--color-text-primary` | `#ebe7e0` | Body text — warm off-white |
| `--color-text-secondary` | `#a29e97` | Secondary text |
| `--color-text-muted` | `#736e68` | Muted/placeholder text |
| `--color-tier-1` | `#5fd18f` | Tier 1 (Verified) — green |
| `--color-tier-2` | `#c4a06f` | Tier 2 (Documented) — warm gold |
| `--color-tier-3` | `#c47171` | Tier 3 (Community reported) — muted red |
| `--color-accent` | `#b86464` | Primary CTA / links |
| `--color-accent-hover` | `#a05555` | CTA hover state |
| `--color-gentle` | `#8a8580` | Inline hints, captions |
| `--color-feedback` | `#a87878` | Form validation errors — visible but not harsh red |
| `--color-dispute` | `#8eb8e8` | Dispute-related actions, focus rings — blue |

**Newsprint Placard (cream, accent/header sections)**
| Token | Hex | Role |
|---|---|---|
| `--color-placard-bg` | `#f4f0e8` | Placard section background — aged cream |
| `--color-placard-ink` | `#23211e` | Placard primary text — near black |
| `--color-placard-rule` | `#d4cfc4` | Placard dividers and borders |
| `--color-placard-muted` | `#656059` | Placard secondary text |
| `--color-placard-accent` | `#8f5a58` | Placard CTA and emphasis |
| `--color-placard-stripe` | `#6e625b` | Left border stripe on placard sections |

### Typography

Fonts loaded via Google Fonts CDN in `index.html`:

| Variable | Family | Weights | Role |
|---|---|---|---|
| `--font-sign` | Bebas Neue | 400 | Brand display, headlines — condensed sans |
| `--font-display` | Playfair Display | 700, 700 italic | Editorial headings, pull quotes — serif |
| `--font-body` | DM Sans | 400, 500 | Body text — geometric sans |
| `--font-mono` | JetBrains Mono | 400, 500 | Code, labels, metadata, tier codes |

Font load strategy: `display=swap` via Google Fonts parameter. Preconnect hints present in `index.html`.

Type scale: Not defined via a modular scale in the config. Tailwind utility sizes (`text-xs` through `text-8xl`) used directly in components. The hierarchy is consistent in practice even without a formalized scale.

### Component Library

All shared components live in `src/components/ui/` and are re-exported from `src/components/ui/index.ts`.

| Component | Description |
|---|---|
| `Button` | Multi-variant button (`primary`, `secondary`, `ghost`, `danger`) with size (`sm`, `md`, `lg`) and surface (`ledger`, `placard`) modes. Full focus/hover/disabled states. |
| `Input` | Labeled text input with `ledger` and `placard` surface modes, error state, helper text, and accessible `aria-describedby` wiring. |
| `Alert` | Status message component. Variants: `info`, `warning`, `error`. Surface modes: `ledger`, `placard`. Inline SVG icons. |
| `Card` | Container with `ledger`, `sheet`, `placard` variants and `none`/`sm`/`md`/`lg` padding. |
| `TierBadge` | Visual badge for record tiers (T1/T2/T3) with color-coded left stripe, tooltip, and semantic label. |
| `OffenseBadge` | Monospace tag displaying offense type label. |
| `Spinner` | Animated loading indicator with `sm`/`md`/`lg` sizes and ARIA `role="status"`. |

**Layout components:**
- `PlacardLead` — cream newspaper-header section with left stripe and kicker text
- `PageShell` — full-page layout with sticky header, responsive nav, footer, `<Outlet />`
- `LogoMark` — logo image component with `on-dark`/`on-light` variants and `decorative` mode for ARIA

**Admin components:**
- `AdminGuard` — route protection wrapper, checks Appwrite session
- `AdminShell` — admin layout with sticky nav and logout button

### Design Language
**Editorial noir.** The design vocabulary is deliberately archival and journalistic — evocative of legal ledgers, court documents, and investigative reporting. The dual-surface system (dark ledger + cream newsprint placard) creates a hierarchical rhythm where header sections feel like newspaper clippings set against a dark background. Typography is extremely intentional: Bebas Neue for impact statements, Playfair Display for gravitas, DM Sans for readability, JetBrains Mono for data. Border radii are `2px` (`--radius-ui`) — minimal but not zero, anchored in precision rather than softness. The color system is calibrated to communicate severity without alarmism — tier badges signal urgency in a restrained palette.

### Responsive Strategy
Mobile-first using Tailwind's default breakpoints. The primary breakpoint in use is `sm:` (640px). Key responsive patterns:
- Navigation collapses to a hamburger menu below `sm:`
- Forms transition from stacked to horizontal layouts at `sm:`
- Typography scales (`text-7xl` → `text-8xl`, `text-4xl` → `text-5xl`)
- Content max-width constrained to `max-w-6xl` (app shell), `max-w-3xl` (content), `max-w-2xl` (forms)

### Dark Mode
**Dark-only.** The application is exclusively dark-themed. `html { color-scheme: dark; }` is set globally. The "placard" cream surface is a component-level design choice (accent sections), not a light mode. No `prefers-color-scheme` media query implementation.

### Brand Assets
| File | Location | Description |
|---|---|---|
| `favicon.svg` | `/public/favicon.svg`, `/favicon.svg` | SVG favicon |
| `witnss-eye-on-dark.png` | `/public/brand/` | Logo mark for dark backgrounds |
| `witnss-eye-on-light.png` | `/public/brand/` | Logo mark for light/cream backgrounds |
| `witnss_eye_preview.png` | `/witnss_logo_pack/` | Preview asset |
| `witnss_eye_512_dark.png` | `/witnss_logo_pack/` | 512px dark variant |
| `witnss_eye_512_light.png` | `/witnss_logo_pack/` | 512px light variant |
| `witnss_eye_512_on_dark.png` | `/witnss_logo_pack/` | 512px on-dark background |
| `witnss_eye_512_on_light.png` | `/witnss_logo_pack/` | 512px on-light background |
| `witnss_eye_512_on_dark Background Removed.png` | `/witnss_logo_pack/` | Transparent background variant |
| `witnss_eye_32_dark.png` | `/witnss_logo_pack/` | 32px dark variant (favicon-scale) |
| `witnss_eye_64_dark.png` | `/witnss_logo_pack/` | 64px dark variant |
| `favicon.svg` | `/witnss_logo_pack/` | SVG favicon variant |

---

## SECTION 5: DATA & SCALE SIGNALS

### User Model
**No public user accounts.** Witnss operates on an anonymous-first model:
- Submissions are anonymous by default. An optional contact email can be provided.
- Disputes require name and contact email but these are not used to create accounts.
- The only authenticated user is the admin (internal Appwrite email/password user).

**User journey (Tier 3 submitter):**
1. Lands on site → reads about tiers on homepage
2. Goes to `/submit`
3. Fills out form (subject name, state, incident type, description ≥100 chars, optional date, optional doc)
4. Chooses anonymous or provides contact email
5. Submits → receives confirmation message; no account created

**User journey (record subject):**
1. Finds their record via search
2. Goes to `/dispute?recordId=<id>`
3. Files dispute with explanation and optional evidence
4. Receives 14-business-day response timeline by email

### Content / Data Volume
No seed files, fixture data, or data volume targets found in the codebase. The system appears designed to start from zero. Rate limiting (3 submissions per IP per 24h) implies modest expected write volume. Search pagination defaults to 20 results. Admin queue queries limit at 500 documents.

### Performance Considerations
- **Pagination:** Search results capped at 20 per page with explicit page navigation.
- **Skeleton loading:** `RecordCardSkeleton` component provides loading placeholders during search fetch.
- **Lazy loading:** No explicit code-splitting or `React.lazy()` found. Single bundle `[INFERRED: would be size-appropriate given small app]`.
- **Rate limiting:** Submission endpoint rate-limited to 3 per IP per 24h (in-memory — resets on cold start; noted in code comment as requiring Redis/DB for production).
- **Image optimization:** Logo images use `decoding="async"` and natural-width sizing. No `srcset` or WebP/AVIF conversion.
- **Font loading:** Google Fonts with `display=swap`. Preconnect hints included.
- **Corroboration hash:** SHA-256 of submission content used for matching related submissions without storing duplicates.
- **No caching layer:** No Redis, CDN edge caching configuration, or Netlify cache headers defined for API responses.

### Analytics / Tracking
**None.** No analytics library (Google Analytics, Plausible, PostHog, etc.) found anywhere in the codebase. No event tracking.

### Error Handling
- **Frontend:** `try/catch` wrapping all `fetch()` calls. User-facing error messages are deliberately compassionate — e.g., *"We couldn't reach the server. When you're ready, check your connection and try again."*
- **Backend:** `try/catch` in all Netlify Functions. Errors returned as JSON `{ error: string }`. `console.error()` for server-side logging.
- **No error monitoring:** No Sentry, Datadog, or similar error reporting service integrated.
- **Graceful degradation:** Admin panel and Support page both render informative states when services are unconfigured.

### Testing
**Zero test coverage.** No test runner configured (`vitest`, `jest`, `playwright`, etc.). No test files found (`*.test.*`, `*.spec.*`). No testing dependencies in `package.json`. This is the most significant quality gap in the codebase.

---

## SECTION 6: MONETIZATION & BUSINESS LOGIC

### Pricing / Tier Structure
None. Witnss has no pricing, subscriptions, or paywalled features. All public functionality is free and unauthenticated.

### Payment Integration
**Donation-only.** Integration is limited to external payment links — no Stripe SDK, no payment processing server-side.
- **Stripe:** Public payment link URLs (`VITE_STRIPE_DONATION_URL` for one-time, `VITE_STRIPE_DONATION_MONTHLY_URL` for monthly). Rendered as `<a href>` links.
- **Venmo:** Deep link to `venmo.com/<username>`.
- If neither is configured, the Support page shows an info alert instead of buttons.

### Subscription / Billing Logic
None.

### Feature Gates
None.

### Usage Limits
- **Submission rate limit:** 3 submissions per IP address per 24-hour window. Enforced in `netlify/functions/submit.ts` via in-memory map (resets on cold start; documented as needing Redis for production).
- **File upload size limit:** 10MB. Enforced on client (`MAX_FILE_SIZE_BYTES`) and server (`MAX_FILE_SIZE` in dispute.ts).
- **File type whitelist:** PDF, JPEG, PNG only. Enforced on client and server.
- **Description minimum:** 100 characters. Enforced on client (form validation) and server.

---

## SECTION 7: CODE QUALITY & MATURITY SIGNALS

### Code Organization
Clear separation of concerns:
- `src/lib/` — pure data layer (types, Appwrite client, constants, utilities)
- `src/components/ui/` — stateless presentational components
- `src/components/layout/` — structural layout components
- `src/pages/` — route-level components (data-fetching + composition)
- `netlify/functions/` — serverless business logic, cleanly isolated
- `netlify/functions/_*.ts` — shared utilities (prefixed underscore convention)

### Patterns & Conventions
- **Factory pattern:** `getAppwriteServer()` returns a configured server client or `null` if unconfigured. Guards every admin function.
- **Helper module pattern:** `_adminAuth.ts` and `_appwriteServer.ts` are shared modules (underscore prefix signals non-route helpers).
- **CSS-in-JS-style extracted classes:** `fieldStyles.ts` centralizes shared Tailwind class strings to avoid repetition across forms.
- **Token-based design system:** CSS custom properties map to Tailwind config via `var(--*)` references.
- **Naming:** snake_case for database field names and API payloads; camelCase for TypeScript variables; PascalCase for components; SCREAMING_SNAKE_CASE for module-level constants.
- **`cn()` utility:** Simple class merger (filter + join) used consistently throughout.

### Documentation
| Area | Quality |
|---|---|
| `README.md` | **Empty** — contains only `# Witnss`. Critical gap. |
| `docs/LOCAL_DEV.md` | Good. Covers Appwrite setup, env vars, dev commands, admin auth flow. |
| `docs/APPWRITE_SETUP.md` | Excellent. Full schema table, collection IDs, bucket setup, admin user creation, permission model. |
| `ATLAS_AGENT_PROMPT.md` | Internal design agent system prompt. Not user-facing documentation. |
| `ATLAS_AUDIT_PROTOCOL.md` | Internal design audit framework. Not user-facing documentation. |
| Inline comments | Sparse but meaningful where present (e.g., rate limit caveat in `submit.ts`). |
| JSDoc | Not used. No function-level documentation. |

### TypeScript Usage
- **Strict mode:** `"strict": true` in `tsconfig.json`, plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **`any` types:** None observed. Manual casting used where Appwrite returns untyped documents (e.g., `(s as { subject_name?: string })`).
- **Interfaces:** Well-defined in `src/lib/types.ts`. All major data structures typed: `Person`, `Record`, `Submission`, `Dispute`, `SearchResult`, `SearchFilters`.
- **Discriminated unions / literal types:** `RecordTier = 1 | 2 | 3`, `RecordStatus`, `OffenseType`, `DisputeNature`.
- **Generic gap:** Appwrite documents are not typed via a generic wrapper — functions cast raw `documents` arrays manually.

### Error Handling Patterns
Consistent `try/catch` throughout. User-facing messages are intentionally non-technical and trauma-informed (e.g., "We're holding this with care"). No custom error classes. Server-side errors `console.error()` with context. No error propagation beyond the immediate function boundary.

### Git Hygiene
- 2 commits total. Branching strategy not yet established.
- Commit messages are verbose and descriptive.
- No `.github/` directory — no issue templates, PR templates, or GitHub Actions workflows.

### Technical Debt Flags
| Flag | Location | Severity |
|---|---|---|
| In-memory rate limiting | `netlify/functions/submit.ts:11` | High — resets on cold start, ineffective at scale |
| US states list duplicated | `src/pages/Search.tsx` uses full names; `src/lib/constants.ts` uses abbreviations | Low — functional inconsistency |
| Appwrite document manual casting | All functions | Low — verbose but safe |
| Empty placeholder directories | `src/hooks/`, `src/components/search/` | Low — orphaned scaffolding |
| No tests | Entire codebase | Critical |
| Empty README | `README.md` | High — investor/contributor facing |

### Security Posture
| Area | Assessment |
|---|---|
| **Input validation** | Strong. File MIME type and size validated on both client and server. Description length enforced on both sides. String fields stripped/trimmed. |
| **File type whitelist** | Enforced at upload (`['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']`). Checked against `Content-Type` from busboy. |
| **Rate limiting** | Present (3/IP/24h) but in-memory — resets on Netlify Function cold start. Not effective against distributed abuse. |
| **SQL injection** | Not applicable — no SQL. Appwrite NoSQL with server SDK. |
| **XSS prevention** | React's default JSX escaping handles user-generated content. No `dangerouslySetInnerHTML` found. |
| **Authentication** | Admin routes require valid Appwrite JWT, verified server-side on every request. No hardcoded credentials. |
| **Secrets management** | Server API key in env vars only, never in browser bundle. Appwrite client-side uses only public project ID. |
| **CORS** | Not explicitly configured in functions. Netlify default CORS behavior applies. `[INFERRED: may need explicit CORS headers for cross-origin API use]` |
| **Content Security Policy** | Not configured. No CSP headers in netlify.toml or function responses. Gap. |
| **Evidence file serving** | Files served through authenticated admin endpoint, not directly from Appwrite public URLs. Correct pattern. |

---

## SECTION 8: ECOSYSTEM CONNECTIONS

### Shared Code with Portfolio Projects
No imports, references, or shared packages from Relevnt, Codra, Ready, Mythos, embr, passagr, or advocera found in the codebase. All code is self-contained.

### Shared Dependencies / Infrastructure
No evidence of shared infrastructure in the codebase. The Appwrite project ID is unique to Witnss. No shared Netlify account configuration, shared component library packages, or monorepo structure.

The architectural pattern (React SPA + Netlify Functions + Appwrite BaaS) may be a portfolio-wide template, but this cannot be verified from the Witnss codebase alone. `[INFERRED]`

### Data Connections
No data connections to external systems beyond Appwrite (Witnss's own backend) and Google Fonts (CDN). No shared databases, message queues, or data pipelines.

### Cross-References
None found. No imports, URL references, or comments referencing sister projects.

---

## SECTION 9: WHAT'S MISSING (CRITICAL)

### Gaps for a Production-Ready Product

| Gap | Impact | Effort |
|---|---|---|
| **Persistent rate limiting** | High — in-memory rate limiting resets on cold start; can be trivially bypassed by waiting for function restart | Low (Upstash Redis or Netlify KV) |
| **Admin notification system** | High — no email/push alerts when new submissions or disputes arrive; admin must manually poll | Medium |
| **Content Security Policy** | High — no CSP headers; open to XSS via injected scripts | Low |
| **Error monitoring** | Medium — no Sentry/Datadog; production failures are invisible | Low |
| **Test coverage** | Critical — zero tests; any regression is invisible | High |
| **Font FOUT mitigation** | Low — Google Fonts with `display=swap` causes flash of unstyled text; self-hosting would fix | Low |
| **Image optimization** | Low — no WebP/AVIF, no responsive images for logo | Low |
| **CORS policy** | Medium — no explicit CORS headers; may cause issues if API is called cross-origin | Low |

### Gaps for Investor Readiness

| Gap | Notes |
|---|---|
| **Empty README** | A visitor to the repo sees `# Witnss` and nothing else. No description, no setup, no vision. |
| **No analytics** | No usage data, no funnel tracking, no evidence of traction. |
| **No privacy policy / terms of service** | The About page discusses legal limitations but no formal legal documents exist in the repo. |
| **No moderation documentation** | The tier review process and dispute resolution timeline (14 business days stated in UI) are referenced in UI copy but not formally documented. |
| **No CI/CD pipeline** | No GitHub Actions for automated build, test, or deploy. Deploys appear to be manual. |
| **No error budget or SLA documentation** | No definition of uptime targets, response time goals, or incident response process. |

### Gaps in the Codebase

| Gap | Location |
|---|---|
| `src/hooks/` directory | Empty (`hooks/.gitkeep` only) — scaffolded but unused |
| `src/components/search/` directory | Empty (`search/.gitkeep` only) — possibly intended for a separate search component |
| States list duplication | `Search.tsx` uses full state names; `constants.ts` uses two-letter abbreviations |
| No loading state on Record detail page | Spinner component exists but not clearly used in record fetch flow |
| Admin has no pagination | Admin queues hard-limit at 500 documents — will become unwieldy at scale |
| No submission deduplication UI | Corroboration hashing exists but no admin UI for viewing matched submissions together |

### Recommended Next Steps (Priority Order)

1. **Replace in-memory rate limiting with persistent store** (Upstash Redis or Netlify KV). This is the only documented technical debt with production-level safety implications. Estimated: 2–4 hours.

2. **Write README.md** — project description, problem statement, setup instructions, architecture overview, deployment guide. This is the first thing any investor, contributor, or reporter sees. Estimated: 2–4 hours.

3. **Set up CI/CD** — GitHub Actions for `npm run build` (TypeScript check + Vite build) on every push. Add basic integration tests for the Netlify Functions (mock Appwrite). Estimated: 1–2 days.

4. **Add admin notification emails** — Trigger an email (via Appwrite's messaging or a simple SendGrid/Resend function) when new submissions or disputes arrive. Without this, admin awareness depends on manual polling. Estimated: 4–8 hours.

5. **Add Content Security Policy headers** — Configure CSP in `netlify.toml` or in function response headers. This is a low-effort, high-impact security improvement for a site that handles sensitive personal disclosures. Estimated: 2–4 hours.

---

## SECTION 10: EXECUTIVE SUMMARY

**What this is and what problem it solves.** Witnss is a survivor-centered public registry that aggregates evidence of domestic violence, sexual assault, stalking, and related abuse into a searchable name index. It addresses a critical information gap: conviction rates for domestic violence are low, most abuse never reaches a legal verdict, and survivors have no accessible mechanism to warn others. Witnss creates a structured, tiered record system — Tier 1 (court-verified), Tier 2 (documented in police/civil records), and Tier 3 (community-submitted) — that makes this information findable while being transparent about its evidentiary weight. The dispute mechanism and conservative microcopy signal a design philosophy that takes legal and ethical risk seriously.

**Technical credibility.** The implementation demonstrates mature architectural judgment. The JAMstack stack (React + Netlify Functions + Appwrite Cloud) is well-matched to the use case: globally distributed reads, low-frequency writes, zero infrastructure management overhead, and a budget that community-funded projects can sustain. The design system is unusually sophisticated for an early-stage project — a fully articulated dual-surface token system, four intentionally selected typefaces, and component-level ARIA compliance. The server-side security model (server API key in functions only, JWT verification on every admin endpoint, file type whitelisting on both client and server) reflects security-aware thinking. The code is well-organized, TypeScript-strict, and readable.

**Honest assessment and next milestone.** The project is at credible early Alpha. The core user journeys work end-to-end, the data model is well-designed, and the UI is polished beyond what the commit count suggests. What it lacks is the scaffolding for a public launch: zero tests, an empty README, in-memory rate limiting that won't survive real traffic, no error monitoring, and no admin notification system. The five highest-leverage improvements — persistent rate limiting, README, CI, admin notifications, and CSP — could all be completed in under a week of focused work. Reaching Beta-readiness (suitable for a limited public launch with a small trusted community) requires those five items plus basic legal documentation (privacy policy, terms). The mission is well-defined, the brand is strong, and the technical foundation is sound; the gap is execution infrastructure, not vision or capability.

---

```
---
AUDIT METADATA
Project: Witnss
Date: 2026-03-20
Agent: GitHub Copilot
Codebase access: Full repository — read access to all committed files
Confidence level: High — all sections sourced from actual code, configs, and documentation;
  inferred items explicitly flagged with [INFERRED]
Sections with gaps:
  Section 1 — Live URL not discoverable from codebase
  Section 2 — CORS behavior inferred from Netlify defaults, not explicitly configured
  Section 8 — Portfolio infrastructure sharing inferred, not verifiable from single repo
Total files analyzed: 49 TypeScript/TSX source files + 8 config/doc files + 11 logo/brand assets
---
```
