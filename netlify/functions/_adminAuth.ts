import { Client, Account } from 'node-appwrite';

export function getAuthBearerToken(headers: Record<string, string | undefined>): string | null {
  const auth = headers['authorization'] ?? headers['Authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

export async function verifyAdminSession(
  jwt: string | null,
): Promise<{ authorized: boolean; error?: string }> {
  if (!jwt) return { authorized: false, error: 'Missing authorization' };
  const endpoint = (process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT ?? '').trim();
  const projectId = (process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID ?? '').trim();
  if (!endpoint || !projectId) {
    return { authorized: false, error: 'Server configuration error' };
  }
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  const account = new Account(client);
  try {
    await account.get();
    return { authorized: true };
  } catch {
    return { authorized: false, error: 'Invalid token' };
  }
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
