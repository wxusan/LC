import 'server-only';
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';

/**
 * Issue a Supabase auth session cookie for the user with the given synthetic
 * email. Works by generating a magic link on behalf of the user (service role)
 * and exchanging the hashed_token immediately against the cookie-scoped client.
 */
export async function issueSessionForEmail(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getServiceSupabase();
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) {
    return { ok: false, error: error?.message ?? 'failed to generate session' };
  }
  const cookieClient = getServerSupabase();
  const verify = await cookieClient.auth.verifyOtp({
    type: 'magiclink',
    token_hash: data.properties.hashed_token,
  });
  if (verify.error) return { ok: false, error: verify.error.message };
  return { ok: true };
}
