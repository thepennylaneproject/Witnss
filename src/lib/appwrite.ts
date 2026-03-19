import { Client, Account, Databases } from 'appwrite';

/** Witnss (Appwrite Cloud NYC) — override with VITE_* in .env if needed */
const DEFAULT_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const DEFAULT_PROJECT_ID = '69bba04d0033f1c4e2e4';

const endpoint =
  (import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined)?.trim() || DEFAULT_ENDPOINT;
const projectId =
  (import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined)?.trim() || DEFAULT_PROJECT_ID;

/** Public app + admin auth need endpoint + project ID (no API key in the browser). */
export const isAppwriteConfigured = Boolean(endpoint && projectId);

const client = new Client().setEndpoint(endpoint).setProject(projectId);
const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };

export function getAccount(): Account | null {
  if (!isAppwriteConfigured) return null;
  return account;
}

/** JWT for Netlify admin functions (Authorization: Bearer …). Max 3600s per Appwrite. */
export async function getAdminBearerToken(): Promise<string | null> {
  const acct = getAccount();
  if (!acct) return null;
  try {
    const { jwt } = await acct.createJWT({ duration: 3600 });
    return jwt;
  } catch {
    return null;
  }
}
