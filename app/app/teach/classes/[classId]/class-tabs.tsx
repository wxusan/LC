'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { createAssignmentAction, deleteAssignmentAction } from '@/lib/data/assignments';
import { removeStudentAction } from '@/lib/data/classes';
import { gradeSubmissionAction } from '@/lib/data/submissions';
import type { Assignment, Submission } from '@/lib/supabase/types';

type Tab = 'students' | 'homework' | 'submissions';

interface Student {
  id: string;
  full_name: string | null;
  username: string;
}

interface SubmissionRow extends Submission {
  student: Student | null;
}

interface Props {
  classId: string;
  className: string;
  students: any[];
  assignments: Assignment[];
  submissions: SubmissionRow[];
  activeTab: string;
}

export function ClassTabs({ classId, className, students, assignments, submissions, activeTab }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (['students', 'homework', 'submissions'].includes(activeTab) ? activeTab : 'students') as Tab;

  const setTab = (t: Tab) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', t);
    router.push(`/teach/classes/${classId}?${params.toString()}`);
  };

  const ungraded = submissions.filter((s) => s.grade === null || s.grade === undefined).length;

  return (
    <div>
      <Tabs<Tab>
        tabs={[
          { value: 'students', label: 'Students', count: students.length },
          { value: 'homework', label: 'Homework', count: assignments.length },
          { value: 'submissions', label: 'Submissions', count: ungraded },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div style={{ marginTop: 16 }}>
        {tab === 'students' && <StudentsTab classId={classId} students={students as Student[]} />}
        {tab === 'homework' && <HomeworkTab classId={classId} assignments={assignments} />}
        {tab === 'submissions' && <SubmissionsTab assignments={assignments} submissions={submissions} />}
      </div>
    </div>
  );
}

function StudentsTab({ classId, students }: { classId: string; students: Student[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const remove = (id: string) => {
    if (!confirm('Remove this student from the class?')) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('class_id', classId);
      fd.set('student_id', id);
      const res = await removeStudentAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Student removed', 'success');
        router.refresh();
      }
    });
  };

  if (!students.length) {
    return (
      <Card>
        <EmptyState icon="users" heading="No students enrolled" body="Ask your LC admin to enroll students." />
      </Card>
    );
  }
  return (
    <Card padding={0}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={s.full_name ?? s.username} userId={s.id} size={28} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{s.full_name ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                      @{s.username}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                <Button size="sm" variant="ghost" loading={isPending} onClick={() => remove(s.id)}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function HomeworkTab({ classId, assignments }: { classId: string; assignments: Assignment[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button leftIcon="plus" onClick={() => setCreateOpen(true)}>New assignment</Button>
      </div>
      {assignments.length === 0 ? (
        <Card>
          <EmptyState icon="clipboard" heading="No assignments yet" body="Create a homework for this class." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {assignments.map((a) => (
            <AssignmentCard key={a.id} a={a} />
          ))}
        </div>
      )}
      <CreateAssignmentModal classId={classId} open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function AssignmentCard({ a }: { a: Assignment }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const remove = () => {
    if (!confirm('Delete this assignment? Submissions will be removed too.')) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', a.id);
      const res = await deleteAssignmentAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Deleted', 'success');
        router.refresh();
      }
    });
  };
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
          {a.description && (
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6 }}>{a.description}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            {a.due_at ? `Due ${new Date(a.due_at).toLocaleDateString()}` : 'No due date'}
          </div>
        </div>
        <Button size="sm" variant="destructive-ghost" loading={isPending} onClick={remove}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

function CreateAssignmentModal({
  classId,
  open,
  onClose,
}: {
  classId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', due_at: '' });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('class_id', classId);
      fd.set('title', form.title);
      fd.set('description', form.description);
      fd.set('due_at', form.due_at);
      const res = await createAssignmentAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.push('Assignment created', 'success');
      setForm({ title: '', description: '', due_at: '' });
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New assignment"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isPending} disabled={!form.title}>Create</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block' }}>
            Description <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{
              width: '100%',
              minHeight: 100,
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              resize: 'vertical',
              fontFamily: 'inherit',
              background: 'var(--card)',
            }}
          />
        </div>
        <Input
          label="Due date"
          type="datetime-local"
          value={form.due_at}
          onChange={(e) => setForm({ ...form, due_at: e.target.value })}
          optional
        />
        {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
      </div>
    </Modal>
  );
}

function SubmissionsTab({
  assignments,
  submissions,
}: {
  assignments: Assignment[];
  submissions: SubmissionRow[];
}) {
  const [active, setActive] = useState<SubmissionRow | null>(null);

  const byAssignment: Record<string, SubmissionRow[]> = {};
  submissions.forEach((s) => {
    byAssignment[s.assignment_id] ??= [];
    byAssignment[s.assignment_id].push(s);
  });

  if (assignments.length === 0) {
    return (
      <Card>
        <EmptyState icon="clipboard" heading="No assignments yet" body="Create an assignment to start receiving submissions." />
      </Card>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {assignments.map((a) => {
          const subs = byAssignment[a.id] ?? [];
          return (
            <Card key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {subs.length} submission{subs.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              {subs.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', padding: '8px 0' }}>
                  No submissions yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {subs.map((s) => (
                    <div
                      key={s.id}
                      className="hover-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setActive(s)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar
                          name={s.student?.full_name ?? s.student?.username ?? '?'}
                          userId={s.student?.id ?? ''}
                          size={24}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {s.student?.full_name ?? s.student?.username ?? 'Unknown'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                            Submitted {new Date(s.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {s.grade !== null && s.grade !== undefined ? (
                        <Badge variant="graded" size="sm">{s.grade}/100</Badge>
                      ) : (
                        <Badge variant="submitted" size="sm">Ungraded</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {active && <GradeDrawer submission={active} onClose={() => setActive(null)} />}
    </>
  );
}

function GradeDrawer({ submission, onClose }: { submission: SubmissionRow; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [grade, setGrade] = useState(submission.grade?.toString() ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', submission.id);
      fd.set('grade', grade);
      fd.set('feedback', feedback);
      const res = await gradeSubmissionAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Graded', 'success');
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={submission.student?.full_name ?? submission.student?.username ?? 'Submission'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={submit} loading={isPending} disabled={!grade}>Save grade</Button>
        </>
      }
    >
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {submission.text_answer && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Written answer</div>
            <div
              style={{
                fontSize: 13,
                padding: 12,
                background: 'var(--subtle)',
                borderRadius: 'var(--radius-md)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {submission.text_answer}
            </div>
          </div>
        )}
        {submission.file_url && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Attachment</div>
            <a href={submission.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: 13 }}>
              Open file
            </a>
          </div>
        )}
        <Input label="Grade (0-100)" value={grade} onChange={(e) => setGrade(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" />
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block' }}>Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={{
              width: '100%',
              minHeight: 100,
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--card)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </Drawer>
  );
}
