import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';

import { ResetForm } from './reset-form';

export const metadata = { title: 'Reset password — Learning Center' };

export default function ResetPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll send a 6-digit code to your phone."
      footer={
        <>
          Remembered it? <Link href="/login" style={{ color: 'var(--primary)' }}>Sign in</Link>
        </>
      }
    >
      <ResetForm />
    </AuthShell>
  );
}
