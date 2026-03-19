import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

export function getAuthBearerToken(headers: Record<string, string | undefined>): string | null {
  const auth = headers['authorization'] ?? headers['Authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

export async function verifyAdminSession(
  token: string | null,
): Promise<{ authorized: boolean; error?: string }> {
  if (!token) return { authorized: false, error: 'Missing authorization' };
  if (!url || !anonKey) return { authorized: false, error: 'Server configuration error' };
  const supabaseAuth = createClient(url, anonKey);
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) return { authorized: false, error: error?.message ?? 'Invalid token' };
  return { authorized: true };
}

export function getServiceRoleClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
