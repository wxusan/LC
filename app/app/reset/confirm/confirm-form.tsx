'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { confirmPasswordResetAction } from '@/lib/auth/actions';

export function ConfirmForm({ phone: initialPhone, devCode }: { phone: string; devCode: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      fd.set('code', code);
      fd.set('password', password);
      const res = await confirmPasswordResetAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 1200);
    });
  };

  if (done) {
    return (
      <div style={{ fontSize: 13, color: 'var(--success)' }}>
        Password updated. Redirecting to sign in…
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        label="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <Input
        label="6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        help={devCode ? `Dev code: ${devCode}` : undefined}
        inputMode="numeric"
      />
      <Input
        label="New password"
        type={show ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        rightIcon={show ? 'eye-off' : 'eye'}
        onRightIconClick={() => setShow((s) => !s)}
        autoComplete="new-password"
      />
      <Input
        label="Confirm password"
        type={show ? 'text' : 'password'}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />
      {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
      <Button
        type="submit"
        loading={isPending}
        disabled={!phone || code.length !== 6 || !password || !confirm}
      >
        Update password
      </Button>
    </form>
  );
}
