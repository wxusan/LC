'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createInvitationAction } from '@/lib/data/invitations';
import {
  archiveLearningCenterAction,
  createLearningCenterAction,
  updateLearningCenterAction,
} from '@/lib/data/learning-centers';
import type { LcStatus, LearningCenter } from '@/lib/supabase/types';

type LcCounts = { teachers: number; students: number; classes: number };

export function LcList({
  items,
  counts,
}: {
  items: LearningCenter[];
  counts: Record<string, LcCounts>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<LearningCenter | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button leftIcon="plus" onClick={() => setCreateOpen(true)}>
          New learning center
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon="building"
            heading="No learning centers yet"
            body="Create your first tenant to get started."
            action={<Button onClick={() => setCreateOpen(true)}>Create LC</Button>}
          />
        </Card>
      ) : (
        <Card padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 14px' }}>Name</th>
                <th style={{ padding: '10px 14px' }}>Slug</th>
                <th style={{ padding: '10px 14px' }}>Teachers</th>
                <th style={{ padding: '10px 14px' }}>Students</th>
                <th style={{ padding: '10px 14px' }}>Classes</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lc) => {
                const c = counts[lc.id] ?? { teachers: 0, students: 0, classes: 0 };
                return (
                  <tr
                    key={lc.id}
                    className="hover-row"
                    onClick={() => setDetail(lc)}
                    style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{lc.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{lc.slug}</td>
                    <td style={{ padding: '10px 14px' }}>{c.teachers}</td>
                    <td style={{ padding: '10px 14px' }}>{c.students}</td>
                    <td style={{ padding: '10px 14px' }}>{c.classes}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge variant={lc.status as LcStatus}>{lc.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <CreateLcModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <LcDetailDrawer lc={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function CreateLcModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('name', name);
      fd.set('slug', slug);
      const res = await createLearningCenterAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.push('Learning center created', 'success');
      setName('');
      setSlug('');
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New learning center"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isPending} disabled={!name || !slug}>
            Create
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          help="lowercase, hyphen-separated; used in URLs"
        />
        {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
      </div>
    </Modal>
  );
}

function LcDetailDrawer({ lc, onClose }: { lc: LearningCenter | null; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!lc) return null;

  const archive = () => {
    if (!confirm(`Archive ${lc.name}? Users will be locked out.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', lc.id);
      const res = await archiveLearningCenterAction(fd);
      if (!res.ok) {
        toast.push(res.error, 'error');
        return;
      }
      toast.push('Archived', 'success');
      onClose();
      router.refresh();
    });
  };

  const reactivate = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', lc.id);
      fd.set('status', 'active');
      const res = await updateLearningCenterAction(fd);
      if (!res.ok) {
        toast.push(res.error, 'error');
        return;
      }
      toast.push('Reactivated', 'success');
      onClose();
      router.refresh();
    });
  };

  return (
    <>
      <Drawer
        open={!!lc}
        onClose={onClose}
        title={lc.name}
        status={<Badge variant={lc.status as LcStatus}>{lc.status}</Badge>}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              {lc.status === 'suspended' ? (
                <Button variant="secondary" onClick={reactivate} loading={isPending}>
                  Reactivate
                </Button>
              ) : (
                <Button variant="destructive-ghost" onClick={archive} loading={isPending}>
                  Suspend
                </Button>
              )}
              <Button leftIcon="send" onClick={() => setInviteOpen(true)}>
                Invite LC admin
              </Button>
            </div>
          </>
        }
      >
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
          <Field label="Slug" value={lc.slug} mono />
          <Field label="Created" value={new Date(lc.created_at).toLocaleDateString()} />
          <Field label="ID" value={lc.id} mono muted />
        </div>
      </Drawer>
      <InviteLcAdminModal
        open={inviteOpen}
        lcId={lc.id}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}

function Field({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{label}</div>
      <div
        style={{
          fontFamily: mono ? 'var(--font-mono)' : undefined,
          color: muted ? 'var(--muted-foreground)' : undefined,
          fontSize: mono ? 12 : 13,
          textAlign: 'right',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InviteLcAdminModal({ open, lcId, onClose }: { open: boolean; lcId: string; onClose: () => void }) {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      fd.set('role', 'lc_admin');
      fd.set('learning_center_id', lcId);
      const res = await createInvitationAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLink(res.data.inviteLink);
      toast.push('Invitation sent', 'success');
    });
  };

  const close = () => {
    setPhone('');
    setError(null);
    setLink(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite LC Admin"
      footer={
        link ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={submit} loading={isPending} disabled={!phone}>Send invitation</Button>
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
          <Input label="Phone" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
        </div>
      )}
    </Modal>
  );
}
