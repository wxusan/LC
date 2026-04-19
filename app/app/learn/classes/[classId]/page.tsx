import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { listAssignmentsForStudent } from '@/lib/data/assignments';
import { getClassWithCounts } from '@/lib/data/classes';
import { getCurrentProfile } from '@/lib/data/profile';
import { getServiceSupabase } from '@/lib/supabase/server';

export const metadata = { title: 'Class — Student' };

function dueBadge(dueAt: string | null, submitted: boolean, graded: boolean) {
  if (graded) return { label: 'Graded', variant: 'graded' as const };
  if (submitted) return { label: 'Submitted', variant: 'submitted' as const };
  if (!dueAt) return { label: 'No due date', variant: 'archived' as const };
  const d = new Date(dueAt);
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return { label: `Overdue · ${d.toLocaleDateString()}`, variant: 'suspended' as const };
  if (diffDays === 0) return { label: 'Due today', variant: 'pending' as const };
  if (diffDays <= 2) return { label: `Due in ${diffDays}d`, variant: 'pending' as const };
  return { label: d.toLocaleDateString(), variant: 'active' as const };
}

export default async function LearnClassPage({ params }: { params: { classId: string } }) {
  const me = await getCurrentProfile();
  const admin = getServiceSupabase();

  const { data: enrollment } = await admin
    .from('class_students')
    .select('class_id')
    .eq('class_id', params.classId)
    .eq('student_id', me.id)
    .maybeSingle();
  if (!enrollment) notFound();

  const { cls, teachers } = await getClassWithCounts(params.classId);
  if (!cls) notFound();

  const assignments = await listAssignmentsForStudent(me.id, params.classId);
  const assignmentIds = assignments.map((a) => a.id);
  const { data: mySubs } = await admin
    .from('submissions')
    .select('assignment_id, grade, submitted_at, graded_at')
    .eq('student_id', me.id)
    .in('assignment_id', assignmentIds.length ? assignmentIds : ['00000000-0000-0000-0000-000000000000']);
  const subByAssignment = new Map<string, any>();
  (mySubs ?? []).forEach((s) => subByAssignment.set(s.assignment_id, s));

  return (
    <div>
      <PageHeader title={cls.name} subtitle={cls.schedule ?? cls.level ?? undefined} />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Teachers</div>
          {teachers.length === 0 ? (
            <EmptyState icon="user" heading="No teacher assigned" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teachers.map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={t.full_name ?? t.username} size={28} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.full_name ?? t.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>@{t.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Class details</div>
          <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
            {cls.subject && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Subject</span>
                <span>{cls.subject}</span>
              </div>
            )}
            {cls.level && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Level</span>
                <span>{cls.level}</span>
              </div>
            )}
            {cls.schedule && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Schedule</span>
                <span>{cls.schedule}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Status</span>
              <Badge variant={cls.status === 'active' ? 'active' : 'archived'} size="sm">
                {cls.status}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Homework</div>
          {assignments.length === 0 ? (
            <EmptyState icon="clipboard" heading="No assignments yet" body="Your teacher hasn't posted anything." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {assignments.map((a) => {
                const sub = subByAssignment.get(a.id);
                const submitted = Boolean(sub?.submitted_at);
                const graded = sub?.grade !== null && sub?.grade !== undefined;
                const b = dueBadge(a.due_at, submitted, graded);
                return (
                  <Link
                    key={a.id}
                    href={`/learn/assignments/${a.id}`}
                    className="hover-row"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      textDecoration: 'none',
                      color: 'var(--foreground)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.title}
                      </div>
                      {a.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--muted-foreground)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {graded && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
                          {sub.grade}%
                        </span>
                      )}
                      <Badge variant={b.variant} size="sm">{b.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
