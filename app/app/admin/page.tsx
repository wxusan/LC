import { Card, KPI } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { getServiceSupabase } from '@/lib/supabase/server';
import { listInvitations } from '@/lib/data/invitations';
import { listLearningCenters } from '@/lib/data/learning-centers';

export const metadata = { title: 'Overview — Admin' };

export default async function AdminOverviewPage() {
  const [lcs, invites, peopleCounts] = await Promise.all([
    listLearningCenters(),
    listInvitations({ status: 'pending' }),
    peopleCountsAll(),
  ]);

  return (
    <div>
      <PageHeader
        title="Super Admin Overview"
        subtitle="Platform-wide health across every learning center."
      />

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 24,
        }}
      >
        <KPI label="Learning Centers" value={lcs.length} hint={`${lcs.filter((l) => l.status === 'active').length} active`} />
        <KPI label="Teachers" value={peopleCounts.teachers} />
        <KPI label="Students" value={peopleCounts.students} />
        <KPI label="Pending invites" value={invites.length} />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', maxWidth: 800 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Recent invitations</div>
          {invites.length === 0 ? (
            <EmptyState icon="inbox" heading="No pending invitations" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invites.slice(0, 8).map((inv) => (
                <div
                  key={inv.id}
                  className="hover-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{inv.phone_number}</span>{' '}
                    <span style={{ color: 'var(--muted-foreground)' }}>
                      • {inv.learning_center?.name ?? '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant={`role-${inv.role}`} size="sm" uppercase>
                      {inv.role.replace('_', ' ')}
                    </Badge>
                    <Badge variant="pending" size="sm">pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

async function peopleCountsAll() {
  const admin = getServiceSupabase();
  const [{ count: teachers }, { count: students }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
  ]);
  return { teachers: teachers ?? 0, students: students ?? 0 };
}
