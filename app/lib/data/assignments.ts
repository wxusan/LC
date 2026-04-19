'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';

import { getCurrentProfile } from './profile';
import { fail, ok, type ActionResult } from './result';

const CreateSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  due_at: z.string().optional().or(z.literal('')),
  attachment_url: z.string().url().optional().or(z.literal('')),
});

async function assertTeacherOfClass(classId: string, teacherId: string): Promise<boolean> {
  const admin = getServiceSupabase();
  const { data } = await admin
    .from('class_teachers')
    .select('class_id')
    .eq('class_id', classId)
    .eq('teacher_id', teacherId)
    .maybeSingle();
  return Boolean(data);
}

export async function createAssignmentAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me.role !== 'teacher') return fail('Only teachers can create assignments');

  const parsed = CreateSchema.safeParse({
    class_id: formData.get('class_id'),
    title: formData.get('title'),
    description: formData.get('description') ?? '',
    due_at: formData.get('due_at') ?? '',
    attachment_url: formData.get('attachment_url') ?? '',
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  if (!(await assertTeacherOfClass(parsed.data.class_id, me.id))) {
    return fail('Not permitted for this class');
  }

  const admin = getServiceSupabase();
  const { data, error } = await admin
    .from('assignments')
    .insert({
      class_id: parsed.data.class_id,
      teacher_id: me.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_at: parsed.data.due_at ? new Date(parsed.data.due_at).toISOString() : null,
      attachment_url: parsed.data.attachment_url || null,
    })
    .select('id')
    .single();
  if (error || !data) return fail(error?.message ?? 'Could not create assignment');
  revalidatePath(`/teach/classes/${parsed.data.class_id}`);
  return ok({ id: data.id });
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  due_at: z.string().optional(),
});

export async function updateAssignmentAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'teacher') return fail('Not permitted');
  const parsed = UpdateSchema.safeParse({
    id: formData.get('id'),
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    due_at: formData.get('due_at') || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  const admin = getServiceSupabase();
  const { data: a } = await admin
    .from('assignments')
    .select('class_id')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (!a || !(await assertTeacherOfClass(a.class_id, me.id))) return fail('Not permitted');

  const { id, due_at, ...rest } = parsed.data;
  const patch = {
    ...rest,
    ...(due_at ? { due_at: new Date(due_at).toISOString() } : {}),
  };
  const { error } = await admin.from('assignments').update(patch).eq('id', id);
  if (error) return fail(error.message);
  revalidatePath(`/teach/classes/${a.class_id}`);
  return ok();
}

export async function deleteAssignmentAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'teacher') return fail('Not permitted');
  const id = String(formData.get('id') ?? '');
  if (!id) return fail('Missing id');
  const admin = getServiceSupabase();
  const { data: a } = await admin.from('assignments').select('class_id').eq('id', id).maybeSingle();
  if (!a || !(await assertTeacherOfClass(a.class_id, me.id))) return fail('Not permitted');
  const { error } = await admin.from('assignments').delete().eq('id', id);
  if (error) return fail(error.message);
  revalidatePath(`/teach/classes/${a.class_id}`);
  return ok();
}

// Read helpers
export async function listAssignmentsForClass(classId: string) {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function listAssignmentsForStudent(studentId: string, classId?: string) {
  const supabase = getServerSupabase();
  let query = supabase
    .from('assignments')
    .select('*, class:classes!inner(id, name, learning_center_id)')
    .order('due_at', { ascending: true });
  if (classId) query = query.eq('class_id', classId);

  // Only assignments for classes the student is in.
  const { data: enrolled } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId);
  const classIds = (enrolled ?? []).map((r) => r.class_id);
  if (!classIds.length) return [];
  query = query.in('class_id', classIds);
  const { data } = await query;
  return data ?? [];
}

export async function getAssignment(id: string) {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('assignments')
    .select('*, class:classes(id, name, learning_center_id)')
    .eq('id', id)
    .maybeSingle();
  return data;
}
