import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');

if (!supabaseAnonKey.startsWith('eyJ')) {
  throw new Error('SUPABASE_ANON_KEY must be the legacy eyJ JWT anon key');
}

export function createSupabaseClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : undefined
  });
}

export const supabase = createSupabaseClient();

export const supabaseAdmin = createClient(
  supabaseUrl,
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
