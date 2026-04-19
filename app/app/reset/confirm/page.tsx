import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';

import { ConfirmForm } from './confirm-form';

export const metadata = { title: 'Confirm reset — Learning Center' };

export default function ConfirmResetPage({
  searchParams,
}: {
  searchParams: { phone?: string; dev?: string };
}) {
  return (
    <AuthShell
      title="Set new password"
      subtitle="Enter the code we sent and pick a new password."
      footer={
        <>
          Back to <Link href="/login" style={{ color: 'var(--primary)' }}>Sign in</Link>
        </>
      }
    >
      <ConfirmForm phone={searchParams.phone ?? ''} devCode={searchParams.dev ?? null} />
    </AuthShell>
  );
}
