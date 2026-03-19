# Appwrite setup for Witnss (empty project)

There is **no data migration** from other systems—create the structure below once in a new Appwrite project.

## 1. Project

- Note **Project ID** → `VITE_APPWRITE_PROJECT_ID`
- Note **API endpoint** (ends with `/v1`) → `VITE_APPWRITE_ENDPOINT`

## 2. API key

Create a server API key with permissions to:

- Databases (read/write on your database)
- Storage (read/write on the evidence bucket)

Set `APPWRITE_API_KEY` in `.env` (Netlify / `netlify dev` only; never in Vite).

## 3. Database

Create a database with ID **`main`** (or set `APPWRITE_DATABASE_ID` to match).

## 4. Collections & attributes

Create four collections with these **collection IDs** (or override via env):

| Collection ID   | Use      |
|----------------|----------|
| `persons`      | Subjects |
| `records`      | Registry rows |
| `submissions`  | Tier 3 intake |
| `disputes`     | Disputes |

### `persons`

| Attribute          | Type     | Required | Notes |
|--------------------|----------|----------|-------|
| `full_name`        | String   | yes      |       |
| `name_aliases`     | String   | no       | Store JSON array as text, e.g. `[]` |
| `dob_approximate`  | String   | no       |       |
| `state`            | String   | yes      |       |
| `county`           | String   | no       |       |

### `records`

| Attribute              | Type     | Required | Notes |
|------------------------|----------|----------|-------|
| `person_id`            | String   | yes      | Document ID of `persons` |
| `tier`                 | Integer  | yes      | 1, 2, or 3 |
| `offense_type`         | String   | yes      |       |
| `offense_date`         | String   | no       | ISO or `YYYY-MM-DD` |
| `jurisdiction_state`   | String   | yes      |       |
| `jurisdiction_county`  | String   | no       |       |
| `source_type`          | String   | yes      |       |
| `source_reference`     | String   | no       |       |
| `verified_at`          | String   | no       | ISO datetime |
| `status`               | String   | yes      | `active`, `disputed`, `under_review`, `removed` |

### `submissions`

| Attribute               | Type     | Required | Notes |
|-------------------------|----------|----------|-------|
| `subject_name`          | String   | yes      |       |
| `subject_state`         | String   | yes      |       |
| `subject_county`        | String   | no       |       |
| `incident_type`         | String   | yes      |       |
| `incident_date`         | String   | no       |       |
| `jurisdiction_state`    | String   | yes      |       |
| `description`           | String   | yes      |       |
| `supporting_doc_url`    | String   | no       | Appwrite **file ID** in evidence bucket |
| `submission_hash`       | String   | yes      |       |
| `review_status`         | String   | yes      | `pending`, `corroborated`, `approved`, `rejected` |
| `corroboration_count`   | Integer  | yes      | Default `1` in app |

Index `submission_hash` if you expect many rows (optional, for performance).

### `disputes`

| Attribute           | Type     | Required | Notes |
|---------------------|----------|----------|-------|
| `record_id`         | String   | yes      | `records` document ID |
| `submitter_name`    | String   | yes      |       |
| `submitter_contact` | String   | yes      |       |
| `claim`             | String   | yes      |       |
| `evidence_url`      | String   | no       | Appwrite **file ID** |
| `status`            | String   | yes      | `pending`, `under_review`, `resolved_removed`, `resolved_retained` |
| `reviewed_at`       | String   | no       | ISO datetime |

## 5. Storage

- Create bucket ID **`evidence`** (or set `APPWRITE_BUCKET_EVIDENCE`).
- Restrict public read; server API key uploads/downloads files.

## 6. Admin user

Under **Auth**, enable **Email/Password**, create a user for the admin panel. That user signs in at `/admin/login`.

## 7. Collection permissions

Netlify functions use the **API key**, not end-user document ACLs, for reads/writes. Configure default collection permissions per your security model; typical pattern: no public read on collections, server key full access.

## 8. Deploy

On Netlify, set the same environment variables (including `APPWRITE_API_KEY`) in the site settings.
