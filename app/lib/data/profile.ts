import 'server-only';
import { redirect } from 'next/navigation';

import { getServerSupabase } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/types';

export async function getCurrentProfile(): Promise<Profile> {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) redirect('/login');
  return data as Profile;
}

export async function getCurrentProfileOrNull(): Promise<Profile | null> {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}
