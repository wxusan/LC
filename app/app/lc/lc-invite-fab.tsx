'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Fab } from '@/components/ui/fab';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createInvitationAction } from '@/lib/data/invitations';

type Role = 'teacher' | 'student';

export function LcInviteFab() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      fd.set('role', role);
      const res = await createInvitationAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLink(res.data.inviteLink);
      toast.push('Invitation sent', 'success');
      router.refresh();
    });
  };

  const close = () => {
    setOpen(false);
    setPhone('');
    setLink(null);
    setError(null);
  };

  return (
    <>
      <Fab icon="plus" label="Invite" onClick={() => setOpen(true)} />
      <Modal
        open={open}
        onClose={close}
        title="Invite a teacher or student"
        footer={
          link ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button onClick={submit} loading={isPending} disabled={!phone}>
                Send invitation
              </Button>
            </>
          )
        }
      >
        {link ? (
          <div style={{ fontSize: 13 }}>
            Invitation sent. Share this link if SMS didn&apos;t deliver:
            <div
              style={{
                marginTop: 8,
                padding: 10,
                background: 'var(--subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                wordBreak: 'break-all',
              }}
            >
              {link}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block' }}>Role</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['teacher', 'student'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: 13,
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      border: '1px solid var(--border-strong)',
                      background: role === r ? 'var(--accent)' : 'var(--card)',
                      color: role === r ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Phone"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
          </div>
        )}
      </Modal>
    </>
  );
}
