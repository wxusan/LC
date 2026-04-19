import Link from 'next/link';

import { Card, KPI } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { listClassesForTeacher } from '@/lib/data/classes';
import { getCurrentProfile } from '@/lib/data/profile';
import { getServiceSupabase } from '@/lib/supabase/server';

export const metadata = { title: 'Dashboard — Teacher' };

export default async function TeacherDashboardPage() {
  const me = await getCurrentProfile();
  const classes = await listClassesForTeacher(me.id);
  const admin = getServiceSupabase();

  const classIds = classes.map((c) => c.id);
  const [{ data: assignments }, { count: studentsCount }, { count: pendingCount }] = await Promise.all([
    admin
      .from('assignments')
      .select('id, class_id, title, due_at, created_at')
      .in('class_id', classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000'])
      .order('due_at', { ascending: true })
      .limit(10),
    admin
      .from('class_students')
      .select('student_id', { count: 'exact', head: true })
      .in('class_id', classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000']),
    admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .is('graded_at', null),
  ]);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${me.full_name ?? me.username}.`} />
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 24 }}>
        <KPI label="My classes" value={classes.length} />
        <KPI label="Students" value={studentsCount ?? 0} />
        <KPI label="Assignments" value={assignments?.length ?? 0} />
        <KPI label="Ungraded" value={pendingCount ?? 0} />
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>My classes</div>
          {classes.length === 0 ? (
            <EmptyState icon="book-open" heading="No classes assigned yet" body="Ask your LC admin to assign you to a class." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {classes.map((c) => (
                <Link key={c.id} href={`/teach/classes/${c.id}`} className="hover-row" style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--foreground)' }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                  <Badge variant={c.status === 'active' ? 'active' : 'archived'} size="sm">{c.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Upcoming assignments</div>
          {!assignments?.length ? (
            <EmptyState icon="clipboard" heading="No upcoming assignments" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {assignments.slice(0, 6).map((a) => (
                <Link key={a.id} href={`/teach/classes/${a.class_id}?tab=homework`} className="hover-row" style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--foreground)', fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{a.title}</span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
                    {a.due_at ? new Date(a.due_at).toLocaleDateString() : 'No due date'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
