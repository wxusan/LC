// Server-side Supabase clients.
//
//  - getServerSupabase(): cookie-scoped, uses the user's session. All RLS
//    policies apply. Use this inside Server Components, Route Handlers,
//    and Server Actions for normal reads/writes on behalf of the user.
//
//  - getServiceSupabase(): SERVICE_ROLE key. Bypasses RLS. Use sparingly
//    for privileged operations like minting invitations, sending OTPs,
//    and verifying tokens. NEVER import this into a client component.
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// NOTE: The manually-defined Database type in `./types.ts` is used as a
// reference for row shapes (`Profile`, `Class`, etc.), but the installed
// @supabase/supabase-js version expects a richer schema shape with
// `Views`, `Functions`, `Enums`, and per-table `Relationships`. Rather than
// regenerating the full schema, these clients are left untyped so that
// `select('*, foo:bar(...)')` nested selects work at runtime.
//
// Consumers should cast to the manual row types (`as Profile`, etc.) where
// they want type safety.

export function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const store = cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Server Components can't write cookies — middleware handles refresh.
        }
      },
    },
  }) as unknown as SupabaseClient;
}

let _service: SupabaseClient | null = null;
export function getServiceSupabase(): SupabaseClient {
  if (_service) return _service;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Service-role operations cannot run.'
    );
  }
  _service = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}
