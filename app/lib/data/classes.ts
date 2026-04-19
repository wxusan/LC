'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';
import type { Class } from '@/lib/supabase/types';

import { getCurrentProfile } from './profile';
import { fail, ok, type ActionResult } from './result';

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  subject: z.string().trim().max(120).optional().or(z.literal('')),
  level: z.string().trim().max(120).optional().or(z.literal('')),
  schedule: z.string().trim().max(120).optional().or(z.literal('')),
});

export async function createClassAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me.role !== 'lc_admin' || !me.learning_center_id) return fail('Not permitted');

  const parsed = CreateSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject') ?? '',
    level: formData.get('level') ?? '',
    schedule: formData.get('schedule') ?? '',
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const admin = getServiceSupabase();
  const { data, error } = await admin
    .from('classes')
    .insert({
      learning_center_id: me.learning_center_id,
      name: parsed.data.name,
      subject: parsed.data.subject || null,
      level: parsed.data.level || null,
      schedule: parsed.data.schedule || null,
      status: 'active',
    })
    .select('id')
    .single();
  if (error || !data) return fail(error?.message ?? 'Could not create class');

  revalidatePath('/lc/classes');
  revalidatePath('/lc');
  return ok({ id: data.id });
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  subject: z.string().trim().max(120).optional(),
  level: z.string().trim().max(120).optional(),
  schedule: z.string().trim().max(120).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export async function updateClassAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'lc_admin') return fail('Not permitted');

  const parsed = UpdateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name') || undefined,
    subject: formData.get('subject') || undefined,
    level: formData.get('level') || undefined,
    schedule: formData.get('schedule') || undefined,
    status: formData.get('status') || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const admin = getServiceSupabase();
  const { data: cls } = await admin
    .from('classes')
    .select('learning_center_id')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (!cls || cls.learning_center_id !== me.learning_center_id) return fail('Not permitted');

  const { id, ...patch } = parsed.data;
  const { error } = await admin.from('classes').update(patch).eq('id', id);
  if (error) return fail(error.message);
  revalidatePath('/lc/classes');
  return ok();
}

export async function assignTeacherAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'lc_admin') return fail('Not permitted');
  const classId = String(formData.get('class_id') ?? '');
  const teacherId = String(formData.get('teacher_id') ?? '');
  if (!classId || !teacherId) return fail('Missing fields');

  const admin = getServiceSupabase();
  const [{ data: cls }, { data: teacher }] = await Promise.all([
    admin.from('classes').select('learning_center_id').eq('id', classId).maybeSingle(),
    admin.from('profiles').select('learning_center_id, role').eq('id', teacherId).maybeSingle(),
  ]);
  if (!cls || cls.learning_center_id !== me.learning_center_id) return fail('Not permitted');
  if (!teacher || teacher.role !== 'teacher' || teacher.learning_center_id !== me.learning_center_id) {
    return fail('Teacher must belong to this LC');
  }
  const { error } = await admin
    .from('class_teachers')
    .upsert({ class_id: classId, teacher_id: teacherId });
  if (error) return fail(error.message);
  revalidatePath('/lc/classes');
  revalidatePath(`/teach/classes/${classId}`);
  return ok();
}

export async function removeTeacherAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'lc_admin') return fail('Not permitted');
  const classId = String(formData.get('class_id') ?? '');
  const teacherId = String(formData.get('teacher_id') ?? '');
  if (!classId || !teacherId) return fail('Missing fields');
  const admin = getServiceSupabase();
  const { data: cls } = await admin
    .from('classes')
    .select('learning_center_id')
    .eq('id', classId)
    .maybeSingle();
  if (!cls || cls.learning_center_id !== me.learning_center_id) return fail('Not permitted');
  const { error } = await admin
    .from('class_teachers')
    .delete()
    .eq('class_id', classId)
    .eq('teacher_id', teacherId);
  if (error) return fail(error.message);
  revalidatePath('/lc/classes');
  return ok();
}

export async function enrollStudentAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'lc_admin') return fail('Not permitted');
  const classId = String(formData.get('class_id') ?? '');
  const studentId = String(formData.get('student_id') ?? '');
  if (!classId || !studentId) return fail('Missing fields');
  const admin = getServiceSupabase();
  const [{ data: cls }, { data: student }] = await Promise.all([
    admin.from('classes').select('learning_center_id').eq('id', classId).maybeSingle(),
    admin.from('profiles').select('learning_center_id, role').eq('id', studentId).maybeSingle(),
  ]);
  if (!cls || cls.learning_center_id !== me.learning_center_id) return fail('Not permitted');
  if (!student || student.role !== 'student' || student.learning_center_id !== me.learning_center_id) {
    return fail('Student must belong to this LC');
  }
  const { error } = await admin
    .from('class_students')
    .upsert({ class_id: classId, student_id: studentId });
  if (error) return fail(error.message);
  revalidatePath('/lc/classes');
  return ok();
}

export async function removeStudentAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'lc_admin' && me.role !== 'teacher') return fail('Not permitted');
  const classId = String(formData.get('class_id') ?? '');
  const studentId = String(formData.get('student_id') ?? '');
  if (!classId || !studentId) return fail('Missing fields');
  const admin = getServiceSupabase();

  if (me.role === 'lc_admin') {
    const { data: cls } = await admin
      .from('classes')
      .select('learning_center_id')
      .eq('id', classId)
      .maybeSingle();
    if (!cls || cls.learning_center_id !== me.learning_center_id) return fail('Not permitted');
  } else {
    const { data: assignment } = await admin
      .from('class_teachers')
      .select('class_id')
      .eq('class_id', classId)
      .eq('teacher_id', me.id)
      .maybeSingle();
    if (!assignment) return fail('Not permitted');
  }

  const { error } = await admin
    .from('class_students')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId);
  if (error) return fail(error.message);
  revalidatePath('/lc/classes');
  revalidatePath(`/teach/classes/${classId}`);
  return ok();
}

// Read helpers
export async function listClassesForLc(lcId: string): Promise<Class[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('learning_center_id', lcId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Class[];
}

export async function listClassesForTeacher(teacherId: string): Promise<Class[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('class_teachers')
    .select('class:classes(*)')
    .eq('teacher_id', teacherId);
  if (error) return [];
  return (data ?? [])
    .map((r: any) => (Array.isArray(r.class) ? r.class[0] : r.class))
    .filter(Boolean) as Class[];
}

export async function listClassesForStudent(studentId: string): Promise<Class[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('class_students')
    .select('class:classes(*)')
    .eq('student_id', studentId);
  if (error) return [];
  return (data ?? [])
    .map((r: any) => (Array.isArray(r.class) ? r.class[0] : r.class))
    .filter(Boolean) as Class[];
}

export async function getClassWithCounts(classId: string) {
  const supabase = getServerSupabase();
  const [classRes, teachersRes, studentsRes] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).maybeSingle(),
    supabase
      .from('class_teachers')
      .select('teacher:profiles(id, full_name, username)')
      .eq('class_id', classId),
    supabase
      .from('class_students')
      .select('student:profiles(id, full_name, username)')
      .eq('class_id', classId),
  ]);
  return {
    cls: classRes.data ?? null,
    teachers: (teachersRes.data ?? []).map((r) => r.teacher).filter(Boolean),
    students: (studentsRes.data ?? []).map((r) => r.student).filter(Boolean),
  };
}
