'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { IconName } from '@/components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { setProfileStatusAction } from '@/lib/data/people';
import type { Profile, UserStatus } from '@/lib/supabase/types';

export function LcPeopleList({
  people,
  emptyHeading,
  emptyIcon,
  currentUserId,
}: {
  people: Profile[];
  emptyHeading: string;
  emptyIcon: IconName;
  currentUserId: string;
}) {
  if (people.length === 0) {
    return (
      <Card>
        <EmptyState icon={emptyIcon} heading={emptyHeading} body="Use the Invite button to onboard someone." />
      </Card>
    );
  }
  return (
    <Card padding={0}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <th style={{ padding: '10px 14px' }}>User</th>
            <th style={{ padding: '10px 14px' }}>Phone</th>
            <th style={{ padding: '10px 14px' }}>Status</th>
            <th style={{ padding: '10px 14px' }} />
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <PersonRow key={p.id} p={p} isCurrentUser={p.id === currentUserId} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function PersonRow({ p, isCurrentUser }: { p: Profile; isCurrentUser: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const setStatus = (status: UserStatus) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', p.id);
      fd.set('status', status);
      const res = await setProfileStatusAction(fd);
      if (!res.ok) {
        toast.push(res.error, 'error');
        return;
      }
      toast.push('Status updated', 'success');
      router.refresh();
    });
  };

  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={p.full_name ?? p.username} userId={p.id} size={28} />
          <div>
            <div style={{ fontWeight: 500 }}>{p.full_name ?? '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
              @{p.username}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.phone_number}</td>
      <td style={{ padding: '8px 14px' }}>
        <Badge variant={p.status} size="sm">{p.status}</Badge>
      </td>
      <td style={{ padding: '8px 14px', textAlign: 'right' }}>
        {!isCurrentUser && p.status === 'active' && (
          <Button size="sm" variant="ghost" loading={isPending} onClick={() => setStatus('suspended')}>
            Suspend
          </Button>
        )}
        {!isCurrentUser && p.status === 'suspended' && (
          <Button size="sm" variant="ghost" loading={isPending} onClick={() => setStatus('active')}>
            Reactivate
          </Button>
        )}
        {isCurrentUser && (
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>You</span>
        )}
      </td>
    </tr>
  );
}
