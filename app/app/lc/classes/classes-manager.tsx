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
import {
  assignTeacherAction,
  createClassAction,
  enrollStudentAction,
  removeStudentAction,
  removeTeacherAction,
  updateClassAction,
} from '@/lib/data/classes';
import type { Class } from '@/lib/supabase/types';

interface Person {
  id: string;
  name: string;
}

interface Props {
  classes: Class[];
  teachers: Person[];
  students: Person[];
  teachersByClass: Record<string, Person[]>;
  studentsByClass: Record<string, Person[]>;
}

export function ClassesManager({
  classes,
  teachers,
  students,
  teachersByClass,
  studentsByClass,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Class | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button leftIcon="plus" onClick={() => setCreateOpen(true)}>
          New class
        </Button>
      </div>
      {classes.length === 0 ? (
        <Card>
          <EmptyState
            icon="book-open"
            heading="No classes yet"
            body="Create your first class to assign teachers and enroll students."
            action={<Button onClick={() => setCreateOpen(true)}>Create class</Button>}
          />
        </Card>
      ) : (
        <Card padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 14px' }}>Name</th>
                <th style={{ padding: '10px 14px' }}>Level</th>
                <th style={{ padding: '10px 14px' }}>Teachers</th>
                <th style={{ padding: '10px 14px' }}>Students</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr
                  key={c.id}
                  className="hover-row"
                  onClick={() => setDetail(c)}
                  style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted-foreground)' }}>{c.level ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{teachersByClass[c.id]?.length ?? 0}</td>
                  <td style={{ padding: '10px 14px' }}>{studentsByClass[c.id]?.length ?? 0}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge variant={c.status === 'active' ? 'active' : 'archived'} size="sm">
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <CreateClassModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {detail && (
        <ClassDrawer
          cls={detail}
          teachers={teachers}
          students={students}
          assignedTeachers={teachersByClass[detail.id] ?? []}
          enrolledStudents={studentsByClass[detail.id] ?? []}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function CreateClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', subject: '', level: '', schedule: '' });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.set(k, v));
      const res = await createClassAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.push('Class created', 'success');
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New class"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isPending} disabled={!form.name}>Create</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} optional />
        <Input label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} optional help="e.g. IELTS 5.5, A2, Intermediate" />
        <Input label="Schedule" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} optional help="e.g. Mon/Wed 18:00-20:00" />
        {error && <div style={{ fontSize: 12, color: 'var(--destructive)' }}>{error}</div>}
      </div>
    </Modal>
  );
}

function ClassDrawer({
  cls,
  teachers,
  students,
  assignedTeachers,
  enrolledStudents,
  onClose,
}: {
  cls: Class;
  teachers: Person[];
  students: Person[];
  assignedTeachers: Person[];
  enrolledStudents: Person[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const availableTeachers = teachers.filter((t) => !assignedTeachers.some((a) => a.id === t.id));
  const availableStudents = students.filter((s) => !enrolledStudents.some((a) => a.id === s.id));

  const assign = (teacherId: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('class_id', cls.id);
      fd.set('teacher_id', teacherId);
      const res = await assignTeacherAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Teacher assigned', 'success');
        router.refresh();
      }
    });
  };
  const unassign = (teacherId: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('class_id', cls.id);
      fd.set('teacher_id', teacherId);
      const res = await removeTeacherAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Teacher removed', 'success');
        router.refresh();
      }
    });
  };
  const enroll = (studentId: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('class_id', cls.id);
      fd.set('student_id', studentId);
      const res = await enrollStudentAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Student enrolled', 'success');
        router.refresh();
      }
    });
  };
  const unenroll = (studentId: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('class_id', cls.id);
      fd.set('student_id', studentId);
      const res = await removeStudentAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Student removed', 'success');
        router.refresh();
      }
    });
  };
  const archive = () => {
    if (!confirm('Archive this class?')) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', cls.id);
      fd.set('status', 'archived');
      const res = await updateClassAction(fd);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Archived', 'success');
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={cls.name}
      status={<Badge variant={cls.status === 'active' ? 'active' : 'archived'} size="sm">{cls.status}</Badge>}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {cls.status === 'active' && (
            <Button variant="destructive-ghost" onClick={archive} loading={isPending}>Archive class</Button>
          )}
        </>
      }
    >
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
          <Fact label="Subject" value={cls.subject ?? '—'} />
          <Fact label="Level" value={cls.level ?? '—'} />
          <Fact label="Schedule" value={cls.schedule ?? '—'} />
        </div>

        <Section title={`Teachers (${assignedTeachers.length})`}>
          {assignedTeachers.map((t) => (
            <ListRow key={t.id} label={t.name} action={
              <Button variant="ghost" size="sm" onClick={() => unassign(t.id)}>Remove</Button>
            } />
          ))}
          {availableTeachers.length > 0 && (
            <AddSelector
              placeholder="Assign teacher…"
              options={availableTeachers}
              onSelect={assign}
            />
          )}
        </Section>

        <Section title={`Students (${enrolledStudents.length})`}>
          {enrolledStudents.map((s) => (
            <ListRow key={s.id} label={s.name} action={
              <Button variant="ghost" size="sm" onClick={() => unenroll(s.id)}>Remove</Button>
            } />
          ))}
          {availableStudents.length > 0 && (
            <AddSelector
              placeholder="Enroll student…"
              options={availableStudents}
              onSelect={enroll}
            />
          )}
        </Section>
      </div>
    </Drawer>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

function ListRow({ label, action }: { label: string; action: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 'var(--radius-md)', background: 'var(--subtle)' }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      {action}
    </div>
  );
}

function AddSelector({ placeholder, options, onSelect }: { placeholder: string; options: Person[]; onSelect: (id: string) => void }) {
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const id = e.target.value;
        if (id) {
          onSelect(id);
          e.target.value = '';
        }
      }}
      style={{
        height: 32,
        padding: '0 10px',
        fontSize: 13,
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--card)',
        marginTop: 4,
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}
