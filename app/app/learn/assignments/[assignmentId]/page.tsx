import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getAssignment } from '@/lib/data/assignments';
import { getCurrentProfile } from '@/lib/data/profile';
import { getMySubmission } from '@/lib/data/submissions';
import { getServiceSupabase } from '@/lib/supabase/server';

import { SubmitForm } from './submit-form';

export const metadata = { title: 'Assignment — Student' };

export default async function LearnAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const me = await getCurrentProfile();
  const assignment = await getAssignment(params.assignmentId);
  if (!assignment) notFound();
  const cls = Array.isArray(assignment.class) ? assignment.class[0] : assignment.class;

  const admin = getServiceSupabase();
  const { data: enrollment } = await admin
    .from('class_students')
    .select('class_id')
    .eq('class_id', assignment.class_id)
    .eq('student_id', me.id)
    .maybeSingle();
  if (!enrollment) notFound();

  const submission = await getMySubmission(params.assignmentId, me.id);
  const graded = submission?.grade !== null && submission?.grade !== undefined;

  const due = assignment.due_at ? new Date(assignment.due_at) : null;
  const overdue = due ? due.getTime() < Date.now() : false;

  return (
    <div>
      <PageHeader
        title={assignment.title}
        subtitle={cls ? (
          <>
            <Link href={`/learn/classes/${cls.id}`} style={{ color: 'var(--primary)' }}>
              {cls.name}
            </Link>
            {due ? ` · due ${due.toLocaleDateString()} ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </>
        ) : undefined}
      />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)' }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Instructions</div>
          {assignment.description ? (
            <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--foreground)', lineHeight: 1.55 }}>
              {assignment.description}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No description provided.</div>
          )}
          {assignment.attachment_url && (
            <div style={{ marginTop: 12 }}>
              <a
                href={assignment.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--primary)' }}
              >
                View attachment ↗
              </a>
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Status</div>
            <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>State</span>
                {graded ? (
                  <Badge variant="graded" size="sm">Graded</Badge>
                ) : submission ? (
                  <Badge variant="submitted" size="sm">Submitted</Badge>
                ) : overdue ? (
                  <Badge variant="suspended" size="sm">Overdue</Badge>
                ) : (
                  <Badge variant="pending" size="sm">Not submitted</Badge>
                )}
              </div>
              {submission?.submitted_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Submitted</span>
                  <span>{new Date(submission.submitted_at).toLocaleString()}</span>
                </div>
              )}
              {graded && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Grade</span>
                    <span style={{ fontWeight: 600 }}>{submission!.grade}%</span>
                  </div>
                  {submission!.feedback && (
                    <div>
                      <div style={{ color: 'var(--muted-foreground)', marginBottom: 4 }}>Feedback</div>
                      <div style={{ whiteSpace: 'pre-wrap', background: 'var(--muted)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                        {submission!.feedback}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            {graded ? 'Your submission' : submission ? 'Update your submission' : 'Submit your work'}
          </div>
          <SubmitForm
            assignmentId={assignment.id}
            classId={assignment.class_id}
            initialText={submission?.text_answer ?? ''}
            initialFileUrl={submission?.file_url ?? ''}
            locked={graded}
          />
        </Card>
      </div>
    </div>
  );
}
