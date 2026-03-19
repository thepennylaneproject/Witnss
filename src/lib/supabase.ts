import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Scaffold: client still created for type-checking; real usage requires .env
  console.warn(
    'Witnss: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for Supabase.',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');
