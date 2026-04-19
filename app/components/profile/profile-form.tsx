'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { changeMyPasswordAction, updateMyProfileAction } from '@/lib/data/people';
import type { Profile } from '@/lib/supabase/types';

const ROLE_LABEL: Record<Profile['role'], string> = {
  super_admin: 'Super Admin',
  lc_admin: 'LC Admin',
  teacher: 'Teacher',
  student: 'Student',
};

export function ProfileForm({ me }: { me: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const [fullName, setFullName] = useState(me.full_name ?? '');
  const [locale, setLocale] = useState(me.locale);
  const [password, setPassword] = useState('');
  const [savePending, startSave] = useTransition();
  const [pwdPending, startPwd] = useTransition();

  const saveName = () => {
    startSave(async () => {
      const fd = new FormData();
      fd.set('full_name', fullName);
      fd.set('locale', locale);
      const res = await updateMyProfileAction(fd);
      if (!res.ok) {
        toast.push(res.error, 'error');
        return;
      }
      toast.push('Profile updated', 'success');
      router.refresh();
    });
  };

  const changePwd = () => {
    startPwd(async () => {
      const fd = new FormData();
      fd.set('password', password);
      const res = await changeMyPasswordAction(fd);
      if (!res.ok) {
        toast.push(res.error, 'error');
        return;
      }
      toast.push('Password updated', 'success');
      setPassword('');
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <Avatar name={me.full_name ?? me.username} userId={me.id} size={60} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{me.full_name ?? me.username}</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
              @{me.username}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <Badge variant={`role-${me.role}`} size="sm" uppercase>
                {ROLE_LABEL[me.role]}
              </Badge>
              <Badge variant={me.status} size="sm">{me.status}</Badge>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)', marginBottom: 4, display: 'block' }}>
              Language
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Profile['locale'])}
              style={{
                height: 34,
                padding: '0 10px',
                fontSize: 13,
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                width: '100%',
              }}
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="uz">O‘zbekcha</option>
            </select>
          </div>
          <Input label="Phone" value={me.phone_number} disabled help="Phone number cannot be changed" />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={saveName} loading={savePending} disabled={!fullName}>
              Save changes
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Change password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            help="At least 8 characters"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={changePwd} loading={pwdPending} disabled={password.length < 8}>
              Update password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
