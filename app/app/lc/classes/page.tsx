import { PageHeader } from '@/components/ui/page-header';
import { listClassesForLc } from '@/lib/data/classes';
import { listPeople } from '@/lib/data/people';
import { getCurrentProfile } from '@/lib/data/profile';
import { getServiceSupabase } from '@/lib/supabase/server';

import { ClassesManager } from './classes-manager';

export const metadata = { title: 'Classes — LC' };

export default async function LcClassesPage() {
  const me = await getCurrentProfile();
  if (!me.learning_center_id) return null;
  const admin = getServiceSupabase();
  const [classes, teachers, students, classTeachers, classStudents] = await Promise.all([
    listClassesForLc(me.learning_center_id),
    listPeople({ role: 'teacher', lcId: me.learning_center_id }),
    listPeople({ role: 'student', lcId: me.learning_center_id }),
    admin
      .from('class_teachers')
      .select('class_id, teacher_id, teacher:profiles(id, full_name, username)'),
    admin
      .from('class_students')
      .select('class_id, student_id, student:profiles(id, full_name, username)'),
  ]);

  const teachersByClass: Record<string, { id: string; name: string }[]> = {};
  (classTeachers.data ?? []).forEach((row) => {
    const t = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher;
    if (!t) return;
    teachersByClass[row.class_id] ??= [];
    teachersByClass[row.class_id].push({ id: t.id, name: t.full_name ?? t.username });
  });
  const studentsByClass: Record<string, { id: string; name: string }[]> = {};
  (classStudents.data ?? []).forEach((row) => {
    const s = Array.isArray(row.student) ? row.student[0] : row.student;
    if (!s) return;
    studentsByClass[row.class_id] ??= [];
    studentsByClass[row.class_id].push({ id: s.id, name: s.full_name ?? s.username });
  });

  return (
    <div>
      <PageHeader title="Classes" subtitle="Organize cohorts, teachers, and students." />
      <ClassesManager
        classes={classes}
        teachers={teachers.map((p) => ({ id: p.id, name: p.full_name ?? p.username }))}
        students={students.map((p) => ({ id: p.id, name: p.full_name ?? p.username }))}
        teachersByClass={teachersByClass}
        studentsByClass={studentsByClass}
      />
    </div>
  );
}
