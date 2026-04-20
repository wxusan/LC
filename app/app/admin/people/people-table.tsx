'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { setProfileStatusAction } from '@/lib/data/people';
import type { Profile, UserRole, UserStatus } from '@/lib/supabase/types';

type PersonRow = Profile & {
  learning_center?: { id: string; name: string } | null;
};

const ROLES: Array<{ value: UserRole | ''; label: string }> = [
  { value: '', label: 'All roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'lc_admin', label: 'LC Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];
const STATUSES: Array<{ value: UserStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

export function PeopleTable({
  people,
  lcs,
  currentFilters,
  currentUserId,
}: {
  people: PersonRow[];
  lcs: { id: string; name: string }[];
  currentFilters: { role?: string; status?: string; lc?: string; q?: string };
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(currentFilters.q ?? '');

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/people?${params.toString()}`);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('q', q);
  };

  const exportCsv = () => {
    const rows = [
      ['full_name', 'username', 'phone', 'role', 'status', 'learning_center', 'created_at'],
      ...people.map((p) => [
        p.full_name ?? '',
        p.username,
        p.phone_number,
        p.role,
        p.status,
        p.learning_center?.name ?? '',
        p.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `people-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
        <form onSubmit={onSearch} style={{ flex: 1, minWidth: 220 }}>
          <Input
            leftIcon="search"
            placeholder="Search name, username, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <FilterSelect
          value={currentFilters.role ?? ''}
          options={ROLES}
          onChange={(v) => setParam('role', v)}
        />
        <FilterSelect
          value={currentFilters.status ?? ''}
          options={STATUSES}
          onChange={(v) => setParam('status', v)}
        />
        <FilterSelect
          value={currentFilters.lc ?? ''}
          options={[{ value: '', label: 'All LCs' }, ...lcs.map((l) => ({ value: l.id, label: l.name }))]}
          onChange={(v) => setParam('lc', v)}
        />
        <Button variant="secondary" leftIcon="download" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      {people.length === 0 ? (
        <Card>
          <EmptyState icon="users" heading="No people match these filters" />
        </Card>
      ) : (
        <Card padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 14px' }}>User</th>
                <th style={{ padding: '10px 14px' }}>Role</th>
                <th style={{ padding: '10px 14px' }}>LC</th>
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
      )}
    </div>
  );
}

function FilterSelect<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: Array<{ value: V; label: string }>;
  onChange: (v: V) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as V)}
      style={{
        height: 32,
        padding: '0 10px',
        fontSize: 13,
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--card)',
        color: 'var(--foreground)',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function PersonRow({ p, isCurrentUser }: { p: PersonRow; isCurrentUser: boolean }) {
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
      toast.push(`Status updated to ${status}`, 'success');
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
      <td style={{ padding: '8px 14px' }}>
        <Badge variant={`role-${p.role}`} size="sm" uppercase>{p.role.replace('_', ' ')}</Badge>
      </td>
      <td style={{ padding: '8px 14px', color: 'var(--muted-foreground)' }}>{p.learning_center?.name ?? '—'}</td>
      <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.phone_number}</td>
      <td style={{ padding: '8px 14px' }}>
        <Badge variant={p.status} size="sm">{p.status}</Badge>
      </td>
      <td style={{ padding: '8px 14px', textAlign: 'right' }}>
        {!isCurrentUser && p.status === 'active' && (
          <Button
            size="sm"
            variant="ghost"
            loading={isPending}
            onClick={() => setStatus('suspended')}
          >
            Suspend
          </Button>
        )}
        {!isCurrentUser && p.status === 'suspended' && (
          <Button
            size="sm"
            variant="ghost"
            loading={isPending}
            onClick={() => setStatus('active')}
          >
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
