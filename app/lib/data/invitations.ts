'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { normalizePhone } from '@/lib/auth/phone';
import { getSmsProvider } from '@/lib/sms/provider';
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

import { getCurrentProfile } from './profile';
import { fail, ok, type ActionResult } from './result';

const InviteSchema = z.object({
  phone: z.string().min(4),
  role: z.enum(['lc_admin', 'teacher', 'student'] as const),
  learning_center_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
});

export async function createInvitationAction(
  formData: FormData,
): Promise<ActionResult<{ inviteLink: string }>> {
  const me = await getCurrentProfile();
  const parsed = InviteSchema.safeParse({
    phone: formData.get('phone'),
    role: formData.get('role'),
    learning_center_id: formData.get('learning_center_id') || undefined,
    class_id: formData.get('class_id') || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return fail('Invalid phone number');

  // Permission gate.
  let lcId: string | null = parsed.data.learning_center_id ?? null;
  if (me.role === 'super_admin') {
    if (parsed.data.role !== 'lc_admin') {
      // Super admins only send lc_admin invites. LC admins send teacher/student.
      return fail('Super admins can only invite LC admins');
    }
    if (!lcId) return fail('Select a learning center');
  } else if (me.role === 'lc_admin') {
    if (parsed.data.role === 'lc_admin') {
      return fail('Only super admins can invite other LC admins');
    }
    lcId = me.learning_center_id;
  } else {
    return fail('You do not have permission to send invitations');
  }

  // Fail fast if the phone already belongs to a user OR a pending invite.
  const admin = getServiceSupabase();
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('phone_number', phone)
    .maybeSingle();
  if (existingProfile) return fail('A user with this phone already exists');

  const { data: pending } = await admin
    .from('invitations')
    .select('id')
    .eq('phone_number', phone)
    .eq('status', 'pending')
    .maybeSingle();
  if (pending) return fail('A pending invitation already exists for this phone');

  const { data: invite, error } = await admin
    .from('invitations')
    .insert({
      phone_number: phone,
      role: parsed.data.role,
      learning_center_id: lcId,
      class_id: parsed.data.class_id ?? null,
      invited_by: me.id,
    })
    .select('id, token')
    .single();
  if (error || !invite) return fail(error?.message ?? 'Could not create invitation');

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const link = `${base}/invite/${invite.token}`;
  const sms = getSmsProvider();
  await sms.send(phone, `Learning Center: you were invited. Accept: ${link}`);
  await admin.from('sms_otp_log').insert({
    phone_number: phone,
    purpose: 'invite',
    success: true,
  });

  revalidatePath('/admin');
  revalidatePath('/lc');
  revalidatePath('/lc/teachers');
  revalidatePath('/lc/students');
  revalidatePath('/admin/learning-centers');
  return ok({ inviteLink: link });
}

export async function resendInvitationAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  const id = String(formData.get('id') ?? '');
  if (!id) return fail('Missing id');
  const admin = getServiceSupabase();
  const { data: invite } = await admin.from('invitations').select('*').eq('id', id).maybeSingle();
  if (!invite) return fail('Invitation not found');
  if (me.role === 'lc_admin' && invite.learning_center_id !== me.learning_center_id) {
    return fail('Not permitted');
  }
  if (me.role !== 'super_admin' && me.role !== 'lc_admin') return fail('Not permitted');
  if (invite.status !== 'pending') return fail('Invitation is not pending');

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const link = `${base}/invite/${invite.token}`;
  await getSmsProvider().send(invite.phone_number, `Learning Center: invitation link ${link}`);
  await admin.from('sms_otp_log').insert({
    phone_number: invite.phone_number,
    purpose: 'invite',
    success: true,
  });
  return ok();
}

export async function cancelInvitationAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  const id = String(formData.get('id') ?? '');
  if (!id) return fail('Missing id');
  const admin = getServiceSupabase();
  const { data: invite } = await admin
    .from('invitations')
    .select('learning_center_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!invite) return fail('Invitation not found');
  if (me.role === 'lc_admin' && invite.learning_center_id !== me.learning_center_id) {
    return fail('Not permitted');
  }
  if (me.role !== 'super_admin' && me.role !== 'lc_admin') return fail('Not permitted');
  if (invite.status !== 'pending') return fail('Invitation is not pending');
  const { error } = await admin.from('invitations').update({ status: 'cancelled' }).eq('id', id);
  if (error) return fail(error.message);
  revalidatePath('/admin');
  revalidatePath('/lc');
  return ok();
}

export async function listInvitations(opts?: { lcId?: string; role?: UserRole; status?: 'pending' | 'accepted' | 'cancelled' | 'expired' }) {
  const supabase = getServerSupabase();
  let query = supabase
    .from('invitations')
    .select('*, learning_center:learning_centers(name)')
    .order('created_at', { ascending: false });
  if (opts?.lcId) query = query.eq('learning_center_id', opts.lcId);
  if (opts?.role) query = query.eq('role', opts.role);
  if (opts?.status) query = query.eq('status', opts.status);
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}
