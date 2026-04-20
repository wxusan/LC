'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';
import type { UserRole, UserStatus } from '@/lib/supabase/types';

import { getCurrentProfile } from './profile';
import { fail, ok, type ActionResult } from './result';

export async function listPeople(opts?: {
  lcId?: string;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}) {
  const supabase = getServerSupabase();
  let query = supabase
    .from('profiles')
    .select('*, learning_center:learning_centers(id, name)')
    .order('created_at', { ascending: false });
  if (opts?.lcId) query = query.eq('learning_center_id', opts.lcId);
  if (opts?.role) query = query.eq('role', opts.role);
  if (opts?.status) query = query.eq('status', opts.status);
  if (opts?.search && opts.search.trim()) {
    const s = opts.search.trim();
    query = query.or(
      `full_name.ilike.%${s}%,username.ilike.%${s}%,phone_number.ilike.%${s}%`,
    );
  }
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

const SetStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'suspended', 'archived']),
});

export async function setProfileStatusAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  const parsed = SetStatusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const admin = getServiceSupabase();
  const { data: target } = await admin
    .from('profiles')
    .select('id, learning_center_id, role')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (!target) return fail('User not found');

  // Nobody can change their own status — prevents self-lockout
  if (target.id === me.id) return fail('You cannot change your own account status');

  if (me.role === 'super_admin') {
    // ok
  } else if (me.role === 'lc_admin') {
    if (target.role === 'super_admin') return fail('Not permitted');
    if (target.role === 'lc_admin' && target.id !== me.id) return fail('Not permitted');
    if (target.learning_center_id !== me.learning_center_id) return fail('Not permitted');
  } else {
    return fail('Not permitted');
  }

  const { error } = await admin
    .from('profiles')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id);
  if (error) return fail(error.message);

  revalidatePath('/admin/people');
  revalidatePath('/lc/teachers');
  revalidatePath('/lc/students');
  return ok();
}

const UpdateNameSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  locale: z.enum(['en', 'ru', 'uz']).optional(),
});

export async function updateMyProfileAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  const parsed = UpdateNameSchema.safeParse({
    full_name: formData.get('full_name'),
    locale: formData.get('locale') || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const admin = getServiceSupabase();
  const { error } = await admin.from('profiles').update(parsed.data).eq('id', me.id);
  if (error) return fail(error.message);
  revalidatePath('/admin/profile');
  revalidatePath('/lc/profile');
  revalidatePath('/teach/profile');
  revalidatePath('/learn/profile');
  return ok();
}

const ChangePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 chars'),
});

export async function changeMyPasswordAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  const parsed = ChangePasswordSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const admin = getServiceSupabase();
  const { error } = await admin.auth.admin.updateUserById(me.id, { password: parsed.data.password });
  if (error) return fail(error.message);
  return ok();
}
