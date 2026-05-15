// src/services/supabase.ts
// Supabase client — service role for backend operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

// Service role client — bypasses RLS for backend operations
// NEVER expose this client to frontend or untrusted code
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a client authenticated as a specific user (respects RLS)
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl!, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
