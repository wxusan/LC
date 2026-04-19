'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';
import { getSmsProvider } from '@/lib/sms/provider';

import {
  OTP_LOCKOUT_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_SECONDS,
  generateOtpCode,
  hashOtp,
} from './otp';
import { normalizePhone } from './phone';
import { issueSessionForEmail } from './session';
import { usernameToSyntheticEmail } from './synthetic-email';

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? {} : { data: T }))
  | { ok: false; error: string };

const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/admin',
  lc_admin: '/lc',
  teacher: '/teach',
  student: '/learn',
};

// -------------------------------------------------------------------------
// Rate-limit helper: returns true if the phone is currently locked out.
// -------------------------------------------------------------------------
async function isPhoneLockedOut(phone: string, purpose: string): Promise<boolean> {
  const admin = getServiceSupabase();
  const since = new Date(Date.now() - OTP_LOCKOUT_MINUTES * 60 * 1000).toISOString();
  const { count } = await admin
    .from('sms_otp_log')
    .select('id', { count: 'exact', head: true })
    .eq('phone_number', phone)
    .eq('purpose', purpose)
    .gte('sent_at', since);
  return (count ?? 0) >= OTP_MAX_ATTEMPTS;
}

// -------------------------------------------------------------------------
// Phone OTP: send
// -------------------------------------------------------------------------
const PhoneSchema = z.string().min(4);

export async function sendOtpAction(formData: FormData): Promise<Result<{ devCode?: string }>> {
  const raw = PhoneSchema.safeParse(formData.get('phone'));
  if (!raw.success) return { ok: false, error: 'Phone is required' };
  const phone = normalizePhone(raw.data);
  if (!phone) return { ok: false, error: 'Invalid phone number' };

  if (await isPhoneLockedOut(phone, 'login')) {
    return { ok: false, error: 'Too many attempts. Try again later.' };
  }

  const admin = getServiceSupabase();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, status')
    .eq('phone_number', phone)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'No account found for this phone' };
  if (profile.status === 'suspended' || profile.status === 'archived') {
    return { ok: false, error: 'Account is not active' };
  }

  const code = generateOtpCode();
  const hash = hashOtp(phone, code);
  await admin.from('sms_otp_log').insert({
    phone_number: phone,
    purpose: 'login',
    code_hash: hash,
    success: true,
  });

  const text = `Learning Center: your login code is ${code}. Expires in ${Math.round(
    OTP_TTL_SECONDS / 60,
  )} minutes.`;
  const sms = getSmsProvider();
  const send = await sms.send(phone, text);
  if (!send.ok) {
    await admin
      .from('sms_otp_log')
      .insert({ phone_number: phone, purpose: 'login', success: false });
    return { ok: false, error: 'Failed to send SMS' };
  }

  // In dev with the mock provider, surface the code so the user can log in without
  // real SMS delivery.
  const devCode = sms.name === 'mock' ? code : undefined;
  return { ok: true, data: { devCode } };
}

// -------------------------------------------------------------------------
// Phone OTP: verify
// -------------------------------------------------------------------------
const VerifySchema = z.object({
  phone: z.string().min(4),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export async function verifyOtpAction(formData: FormData): Promise<Result> {
  const parsed = VerifySchema.safeParse({
    phone: formData.get('phone'),
    code: formData.get('code'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: 'Invalid phone number' };

  const admin = getServiceSupabase();

  // Dev bypass: in mock mode, "000000" is always accepted so testers don't
  // have to read the console/toast every time. DO NOT enable in prod.
  const isMock = (process.env.SMS_PROVIDER ?? 'mock') === 'mock';
  const bypass = isMock && parsed.data.code === '000000';

  if (!bypass) {
    const since = new Date(Date.now() - OTP_TTL_SECONDS * 1000).toISOString();
    const { data: rows } = await admin
      .from('sms_otp_log')
      .select('id, code_hash, sent_at')
      .eq('phone_number', phone)
      .eq('purpose', 'login')
      .eq('success', true)
      .gte('sent_at', since)
      .order('sent_at', { ascending: false })
      .limit(1);

    const row = rows?.[0];
    if (!row || !row.code_hash) return { ok: false, error: 'Code expired. Request a new one.' };
    if (row.code_hash !== hashOtp(phone, parsed.data.code)) {
      return { ok: false, error: 'Incorrect code' };
    }

    // Consume the OTP so it can't be reused.
    await admin.from('sms_otp_log').delete().eq('id', row.id);
  }

  // Look up the profile to get the username, then issue a session as the
  // primary auth user (username@lc.internal). The phone-email shadow user
  // approach is not used — the primary user is what has a profile row.
  const admin2 = getServiceSupabase();
  const { data: profile } = await admin2
    .from('profiles')
    .select('username')
    .eq('phone_number', phone)
    .maybeSingle();
  if (!profile?.username) return { ok: false, error: 'Account not found' };

  const issued = await issueSessionForEmail(usernameToSyntheticEmail(profile.username));
  if (!issued.ok) return { ok: false, error: issued.error };

  return { ok: true };
}

// -------------------------------------------------------------------------
// Username + password login
// -------------------------------------------------------------------------
const PasswordSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username is required')
    .regex(/^[a-z0-9_-]{3,24}$/, 'Username must be 3-24 chars (a-z, 0-9, _ or -)'),
  password: z.string().min(1, 'Password is required'),
});

export async function passwordLoginAction(formData: FormData): Promise<Result> {
  const parsed = PasswordSchema.safeParse({
    username: String(formData.get('username') ?? '').toLowerCase(),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = getServerSupabase();
  const email = usernameToSyntheticEmail(parsed.data.username);
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) return { ok: false, error: 'Invalid username or password' };
  return { ok: true };
}

// -------------------------------------------------------------------------
// Invitation accept: create auth user + profile, then sign in.
// -------------------------------------------------------------------------
const AcceptInviteSchema = z.object({
  token: z.string().min(10),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,24}$/, 'Username must be 3-24 chars (a-z, 0-9, _ or -)'),
  password: z.string().min(8, 'Password must be at least 8 chars'),
  full_name: z.string().trim().min(1, 'Name is required').max(120),
  locale: z.enum(['en', 'ru', 'uz']).optional(),
});

export async function acceptInviteAction(formData: FormData): Promise<Result> {
  const parsed = AcceptInviteSchema.safeParse({
    token: formData.get('token'),
    username: String(formData.get('username') ?? '').toLowerCase(),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    locale: formData.get('locale') ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const admin = getServiceSupabase();
  const { data: invite, error: inviteErr } = await admin
    .from('invitations')
    .select('*')
    .eq('token', parsed.data.token)
    .maybeSingle();
  if (inviteErr || !invite) return { ok: false, error: 'Invalid invitation' };
  if (invite.status !== 'pending') return { ok: false, error: 'This invitation is no longer active' };
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await admin.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
    return { ok: false, error: 'Invitation expired' };
  }

  // Reject duplicate username / phone.
  const { data: existing } = await admin
    .from('profiles')
    .select('id, username, phone_number')
    .or(`username.eq.${parsed.data.username},phone_number.eq.${invite.phone_number}`)
    .limit(1);
  if (existing && existing.length) {
    if (existing[0].username === parsed.data.username) return { ok: false, error: 'Username is taken' };
    return { ok: false, error: 'A user with this phone already exists' };
  }

  const email = usernameToSyntheticEmail(parsed.data.username);
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    phone: invite.phone_number,
    phone_confirm: true,
    user_metadata: { full_name: parsed.data.full_name, username: parsed.data.username },
  });
  if (userErr || !userRes?.user) {
    return { ok: false, error: userErr?.message ?? 'Could not create account' };
  }

  const { error: profErr } = await admin.from('profiles').insert({
    id: userRes.user.id,
    phone_number: invite.phone_number,
    username: parsed.data.username,
    full_name: parsed.data.full_name,
    role: invite.role,
    status: 'active',
    learning_center_id: invite.learning_center_id,
    locale: parsed.data.locale ?? 'ru',
  });
  if (profErr) {
    // Rollback auth user if profile insert failed.
    await admin.auth.admin.deleteUser(userRes.user.id);
    return { ok: false, error: profErr.message };
  }

  // Add student to class if invite was class-scoped.
  if (invite.role === 'student' && invite.class_id) {
    await admin.from('class_students').insert({
      class_id: invite.class_id,
      student_id: userRes.user.id,
    });
  }
  if (invite.role === 'teacher' && invite.class_id) {
    await admin.from('class_teachers').insert({
      class_id: invite.class_id,
      teacher_id: userRes.user.id,
    });
  }

  await admin
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  const supabase = getServerSupabase();
  await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  return { ok: true };
}

// -------------------------------------------------------------------------
// Password reset: request OTP, then confirm new password.
// -------------------------------------------------------------------------
export async function requestPasswordResetAction(formData: FormData): Promise<Result<{ devCode?: string; phone: string }>> {
  const raw = PhoneSchema.safeParse(formData.get('phone'));
  if (!raw.success) return { ok: false, error: 'Phone is required' };
  const phone = normalizePhone(raw.data);
  if (!phone) return { ok: false, error: 'Invalid phone number' };

  if (await isPhoneLockedOut(phone, 'password_reset')) {
    return { ok: false, error: 'Too many attempts. Try again later.' };
  }

  const admin = getServiceSupabase();
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('phone_number', phone)
    .maybeSingle();
  // Always answer as if we sent — do not leak which phones exist.
  if (!profile) return { ok: true, data: { phone } };

  const code = generateOtpCode();
  await admin.from('sms_otp_log').insert({
    phone_number: phone,
    purpose: 'password_reset',
    code_hash: hashOtp(phone, code),
    success: true,
  });

  const sms = getSmsProvider();
  const send = await sms.send(
    phone,
    `Learning Center: password reset code ${code}. Expires in ${Math.round(OTP_TTL_SECONDS / 60)} min.`,
  );
  if (!send.ok) return { ok: false, error: 'Failed to send SMS' };

  return { ok: true, data: { devCode: sms.name === 'mock' ? code : undefined, phone } };
}

const ConfirmResetSchema = z.object({
  phone: z.string().min(4),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8, 'Password must be at least 8 chars'),
});

export async function confirmPasswordResetAction(formData: FormData): Promise<Result> {
  const parsed = ConfirmResetSchema.safeParse({
    phone: formData.get('phone'),
    code: formData.get('code'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: 'Invalid phone number' };

  const admin = getServiceSupabase();
  const since = new Date(Date.now() - OTP_TTL_SECONDS * 1000).toISOString();
  const { data: rows } = await admin
    .from('sms_otp_log')
    .select('id, code_hash')
    .eq('phone_number', phone)
    .eq('purpose', 'password_reset')
    .eq('success', true)
    .gte('sent_at', since)
    .order('sent_at', { ascending: false })
    .limit(1);
  const row = rows?.[0];
  if (!row || !row.code_hash || row.code_hash !== hashOtp(phone, parsed.data.code)) {
    return { ok: false, error: 'Incorrect or expired code' };
  }
  await admin.from('sms_otp_log').delete().eq('id', row.id);

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('phone_number', phone)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'No account found' };

  const { error } = await admin.auth.admin.updateUserById(profile.id, {
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// -------------------------------------------------------------------------
// Sign out
// -------------------------------------------------------------------------
export async function signOutAction(): Promise<void> {
  const supabase = getServerSupabase();
  await supabase.auth.signOut();
  redirect('/login');
}

// -------------------------------------------------------------------------
// Post-login redirect: send user to role home.
// -------------------------------------------------------------------------
export async function redirectToHomeAction(next?: string): Promise<void> {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) redirect('/login');
  const role = (profile as { role: UserRole }).role;
  redirect(next && next.startsWith('/') ? next : ROLE_HOME[role]);
}
