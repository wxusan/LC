'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import {
  passwordLoginAction,
  redirectToHomeAction,
  sendOtpAction,
  verifyOtpAction,
} from '@/lib/auth/actions';

type Tab = 'phone' | 'password';

export function LoginForm({ next }: { next?: string }) {
  const [tab, setTab] = useState<Tab>('phone');
  return (
    <div>
      <Tabs<Tab>
        tabs={[
          { value: 'phone', label: 'Phone OTP' },
          { value: 'password', label: 'Username' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div style={{ marginTop: 18 }}>
        {tab === 'phone' ? <PhoneForm next={next} /> : <PasswordForm next={next} />}
      </div>
    </div>
  );
}

function PhoneForm({ next }: { next?: string }) {
  const toast = useToast();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSend = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      const res = await sendOtpAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSent(true);
      setDevCode(res.data.devCode ?? null);
      toast.push('Code sent', 'success');
    });
  };

  const onVerify = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      fd.set('code', code);
      const res = await verifyOtpAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await redirectToHomeAction(next);
      router.refresh();
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        label="Phone"
        placeholder="+998 90 123 45 67"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={sent}
        autoComplete="tel"
      />
      {sent && (
        <Input
          label="6-digit code"
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoFocus
          help={devCode ? `Dev code: ${devCode}` : undefined}
        />
      )}
      {error && (
        <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>
      )}
      {!sent ? (
        <Button onClick={onSend} loading={isPending} disabled={!phone.trim()}>
          Send code
        </Button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => { setSent(false); setCode(''); setDevCode(null); }}>
            Back
          </Button>
          <Button onClick={onVerify} loading={isPending} disabled={code.length !== 6} style={{ flex: 1 }}>
            Verify
          </Button>
        </div>
      )}
    </div>
  );
}

function PasswordForm({ next }: { next?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('username', username);
      fd.set('password', password);
      const res = await passwordLoginAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await redirectToHomeAction(next);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        label="Username"
        placeholder="ismoilov"
        prefix="@"
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase())}
        autoComplete="username"
      />
      <Input
        label="Password"
        type={show ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        rightIcon={show ? 'eye-off' : 'eye'}
        onRightIconClick={() => setShow((s) => !s)}
      />
      {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
      <Button type="submit" loading={isPending} disabled={!username || !password}>
        Sign in
      </Button>
    </form>
  );
}
