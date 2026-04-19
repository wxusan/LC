import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { getServiceSupabase } from '@/lib/supabase/server';

import { AcceptInviteForm } from './accept-form';

export const metadata = { title: 'Accept invitation — Learning Center' };

export default async function InvitePage({ params }: { params: { token: string } }) {
  const admin = getServiceSupabase();
  const { data: invite } = await admin
    .from('invitations')
    .select('id, phone_number, role, status, expires_at, learning_center_id, class_id')
    .eq('token', params.token)
    .maybeSingle();

  let reason: string | null = null;
  if (!invite) reason = 'This invitation link is invalid.';
  else if (invite.status !== 'pending') reason = 'This invitation has already been used or cancelled.';
  else if (new Date(invite.expires_at).getTime() < Date.now()) reason = 'This invitation has expired.';

  if (reason) {
    return (
      <AuthShell
        title="Invitation unavailable"
        subtitle={reason}
        footer={<Link href="/login" style={{ color: 'var(--primary)' }}>Go to sign in</Link>}
      >
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          Ask your administrator to send you a new invitation.
        </div>
      </AuthShell>
    );
  }

  let lcName: string | null = null;
  if (invite!.learning_center_id) {
    const { data: lc } = await admin
      .from('learning_centers')
      .select('name')
      .eq('id', invite!.learning_center_id)
      .maybeSingle();
    lcName = lc?.name ?? null;
  }

  const roleLabel = ({
    super_admin: 'Super Admin',
    lc_admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
  } as Record<string, string>)[invite!.role] ?? invite!.role;

  return (
    <AuthShell
      title={`You're invited as ${roleLabel}`}
      subtitle={lcName ? `Joining ${lcName}` : 'Set up your account to continue.'}
      footer={
        <>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary)' }}>Sign in</Link>
        </>
      }
    >
      <AcceptInviteForm token={params.token} phone={invite!.phone_number} />
    </AuthShell>
  );
}
