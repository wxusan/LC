import { Card, KPI } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { listInvitations } from '@/lib/data/invitations';
import { getLcCounts } from '@/lib/data/learning-centers';
import { getCurrentProfile } from '@/lib/data/profile';
import { getServiceSupabase } from '@/lib/supabase/server';

import { LcInviteFab } from './lc-invite-fab';

export const metadata = { title: 'Overview — LC' };

export default async function LcOverviewPage() {
  const me = await getCurrentProfile();
  if (!me.learning_center_id) {
    return <EmptyState icon="building" heading="No learning center" body="Contact support." />;
  }
  const admin = getServiceSupabase();
  const [{ data: lc }, counts, invites, classes] = await Promise.all([
    admin.from('learning_centers').select('*').eq('id', me.learning_center_id).maybeSingle(),
    getLcCounts(me.learning_center_id),
    listInvitations({ lcId: me.learning_center_id, status: 'pending' }),
    admin
      .from('classes')
      .select('id, name, status, created_at')
      .eq('learning_center_id', me.learning_center_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <div>
      <PageHeader
        title={lc?.name ?? 'Learning Center'}
        subtitle={`Slug: ${lc?.slug ?? ''}`}
      />
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 24,
        }}
      >
        <KPI label="Teachers" value={counts.teachers} />
        <KPI label="Students" value={counts.students} />
        <KPI label="Classes" value={counts.classes} />
        <KPI label="Pending invites" value={invites.length} />
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Recent classes</div>
          {!classes.data?.length ? (
            <EmptyState icon="book-open" heading="No classes yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {classes.data.map((c) => (
                <div key={c.id} className="hover-row" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                  <Badge variant={c.status === 'active' ? 'active' : 'archived'} size="sm">{c.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Pending invitations</div>
          {invites.length === 0 ? (
            <EmptyState icon="inbox" heading="No pending invitations" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {invites.slice(0, 6).map((inv) => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', fontSize: 13 }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{inv.phone_number}</span>
                  <Badge variant={`role-${inv.role}`} size="sm" uppercase>{inv.role.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <LcInviteFab />
    </div>
  );
}
