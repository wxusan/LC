// Browser-side Supabase client. Use inside "use client" components
// or inside utilities that run in the browser. Uses the anon key; RLS
// policies gate what the user can read/write.
import { createBrowserClient } from '@supabase/ssr';

export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env.local and fill them in.'
    );
  }
  return createBrowserClient(url, anon);
}
