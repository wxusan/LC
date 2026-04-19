import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, KPI } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { listAssignmentsForStudent } from '@/lib/data/assignments';
import { listClassesForStudent } from '@/lib/data/classes';
import { getCurrentProfile } from '@/lib/data/profile';
import { listSubmissionsForStudent } from '@/lib/data/submissions';

export const metadata = { title: 'Dashboard — Student' };

function dueBadge(dueAt: string | null): { label: string; variant: 'pending' | 'active' | 'archived' | 'suspended' } {
  if (!dueAt) return { label: 'No due date', variant: 'archived' };
  const d = new Date(dueAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return { label: `Overdue · ${d.toLocaleDateString()}`, variant: 'suspended' };
  if (diffDays === 0) return { label: 'Due today', variant: 'pending' };
  if (diffDays <= 2) return { label: `Due in ${diffDays}d`, variant: 'pending' };
  return { label: d.toLocaleDateString(), variant: 'active' };
}

export default async function StudentDashboardPage() {
  const me = await getCurrentProfile();
  const [classes, assignments, submissions] = await Promise.all([
    listClassesForStudent(me.id),
    listAssignmentsForStudent(me.id),
    listSubmissionsForStudent(me.id),
  ]);

  const submittedIds = new Set(submissions.map((s) => s.assignment_id));
  const pending = assignments.filter((a) => !submittedIds.has(a.id));
  const graded = submissions.filter((s) => s.grade !== null && s.grade !== undefined);
  const avg =
    graded.length > 0
      ? Math.round(graded.reduce((acc, s) => acc + (s.grade ?? 0), 0) / graded.length)
      : null;

  const upcoming = pending.slice(0, 6);
  const recentGrades = graded.slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${me.full_name ?? me.username}.`} />
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 24,
        }}
      >
        <KPI label="My classes" value={classes.length} />
        <KPI label="Pending homework" value={pending.length} />
        <KPI label="Submitted" value={submissions.length} />
        <KPI label="Average grade" value={avg !== null ? `${avg}%` : '—'} />
      </div>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>My classes</div>
          {classes.length === 0 ? (
            <EmptyState
              icon="book-open"
              heading="No classes yet"
              body="Ask your teacher or LC admin to enroll you."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/learn/classes/${c.id}`}
                  className="hover-row"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    color: 'var(--foreground)',
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
                    {c.level ?? c.subject ?? ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Upcoming homework</div>
          {upcoming.length === 0 ? (
            <EmptyState icon="clipboard" heading="Nothing due" body="You're all caught up." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcoming.map((a) => {
                const d = dueBadge(a.due_at);
                return (
                  <Link
                    key={a.id}
                    href={`/learn/assignments/${a.id}`}
                    className="hover-row"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      textDecoration: 'none',
                      color: 'var(--foreground)',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </span>
                    <Badge variant={d.variant} size="sm">
                      {d.label}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Recent grades</div>
          {recentGrades.length === 0 ? (
            <EmptyState icon="star" heading="No grades yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentGrades.map((s: any) => {
                const assignment = Array.isArray(s.assignment) ? s.assignment[0] : s.assignment;
                const className = assignment?.class?.name ?? '';
                return (
                  <Link
                    key={s.id}
                    href={assignment ? `/learn/assignments/${assignment.id}` : '#'}
                    className="hover-row"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      textDecoration: 'none',
                      color: 'var(--foreground)',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {assignment?.title ?? 'Assignment'}
                      </span>
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{className}</span>
                    </span>
                    <Badge variant={(s.grade ?? 0) >= 70 ? 'active' : 'pending'} size="sm">
                      {s.grade}%
                    </Badge>
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
