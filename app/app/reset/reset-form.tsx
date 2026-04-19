'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestPasswordResetAction } from '@/lib/auth/actions';

export function ResetForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sentPhone, setSentPhone] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      const res = await requestPasswordResetAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDevCode(res.data.devCode ?? null);
      setSentPhone(res.data.phone);
      // Forward to confirm step
      const q = new URLSearchParams({ phone: res.data.phone });
      if (res.data.devCode) q.set('dev', res.data.devCode);
      router.push(`/reset/confirm?${q.toString()}`);
    });
  };

  if (sentPhone && !isPending) {
    return (
      <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
        If an account exists for that phone, we just sent a code.
        {devCode && (
          <div style={{ marginTop: 8 }}>
            Dev code: <span style={{ fontFamily: 'var(--font-mono)' }}>{devCode}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        label="Phone"
        placeholder="+998 90 123 45 67"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
      <Button type="submit" loading={isPending} disabled={!phone.trim()}>
        Send code
      </Button>
    </form>
  );
}
