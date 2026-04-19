'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { acceptInviteAction, redirectToHomeAction } from '@/lib/auth/actions';
import { maskPhone } from '@/lib/auth/phone';

export function AcceptInviteForm({ token, phone }: { token: string; phone: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      fd.set('token', token);
      fd.set('full_name', fullName);
      fd.set('username', username);
      fd.set('password', password);
      const res = await acceptInviteAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await redirectToHomeAction();
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--muted-foreground)',
          background: 'var(--subtle)',
          border: '1px solid var(--border)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-md)',
        }}
      >
        Phone: <span style={{ fontFamily: 'var(--font-mono)' }}>{maskPhone(phone)}</span>
      </div>
      <Input
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoComplete="name"
      />
      <Input
        label="Username"
        prefix="@"
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase())}
        help="3-24 chars, a-z 0-9 _ -"
        autoComplete="username"
      />
      <Input
        label="Password"
        type={show ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        rightIcon={show ? 'eye-off' : 'eye'}
        onRightIconClick={() => setShow((s) => !s)}
        help="At least 8 characters"
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
        disabled={!fullName || !username || !password || !confirm}
      >
        Create account
      </Button>
    </form>
  );
}
