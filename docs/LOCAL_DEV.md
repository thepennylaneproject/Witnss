# Local development

## Appwrite

Witnss uses **Appwrite** for the database, storage (`evidence` bucket), and admin authentication. Public search/record/submit/dispute flows go through **Netlify Functions**, which use the **Appwrite server API key**.

1. Create a project in [Appwrite Cloud](https://cloud.appwrite.io) (or run Appwrite self‑hosted).
2. Follow **[docs/APPWRITE_SETUP.md](./APPWRITE_SETUP.md)** to create the database, collections, bucket, and an admin user.
3. Copy `.env.example` to `.env` and set:
   - `VITE_APPWRITE_ENDPOINT` — e.g. `https://cloud.appwrite.io/v1` or your self‑hosted `/v1` URL
   - `VITE_APPWRITE_PROJECT_ID` — project ID from the Appwrite console
   - `APPWRITE_API_KEY` — API key with access to Databases, Storage, and (for JWT verification) usable from functions; scope it per Appwrite best practices
4. Restart the dev server after changing `.env`.

## Run the app

- **Frontend only:** `npm run dev`  
- **Frontend + Netlify functions:** `netlify dev` (loads `.env` for functions)

Admin sign-in uses the Appwrite **Account** email/password session. Netlify admin endpoints expect `Authorization: Bearer <JWT>`; the app obtains the JWT via `account.createJWT()` after login.

## Optional: self‑hosted Appwrite

If you run Appwrite with Docker, use your instance’s API endpoint (must end with `/v1`) and the same env vars. No separate SQL migration is required for an empty project—define collections as in **APPWRITE_SETUP.md**.
