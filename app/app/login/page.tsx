import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';

import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in — Learning Center' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const errorCode = searchParams.error;
  const errorMsg =
    errorCode === 'account_suspended'
      ? 'Your account is suspended. Contact your administrator.'
      : null;
  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your phone number or username to continue."
      footer={
        <>
          Forgot password? <Link href="/reset" style={{ color: 'var(--primary)' }}>Reset</Link>
        </>
      }
    >
      {errorMsg && (
        <div
          style={{
            background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
            color: 'var(--destructive)',
            border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {errorMsg}
        </div>
      )}
      <LoginForm next={searchParams.next} />
    </AuthShell>
  );
}
