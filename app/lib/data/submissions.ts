'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';

import { getCurrentProfile } from './profile';
import { fail, ok, type ActionResult } from './result';

const SubmitSchema = z.object({
  assignment_id: z.string().uuid(),
  text_answer: z.string().trim().max(8000).optional().or(z.literal('')),
  file_url: z.string().url().optional().or(z.literal('')),
});

export async function submitAssignmentAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me.role !== 'student') return fail('Only students can submit');
  const parsed = SubmitSchema.safeParse({
    assignment_id: formData.get('assignment_id'),
    text_answer: formData.get('text_answer') ?? '',
    file_url: formData.get('file_url') ?? '',
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
  if (!parsed.data.text_answer && !parsed.data.file_url) {
    return fail('Provide an answer or attach a file');
  }

  const admin = getServiceSupabase();
  const { data: assignment } = await admin
    .from('assignments')
    .select('id, class_id')
    .eq('id', parsed.data.assignment_id)
    .maybeSingle();
  if (!assignment) return fail('Assignment not found');

  const { data: enrollment } = await admin
    .from('class_students')
    .select('class_id')
    .eq('class_id', assignment.class_id)
    .eq('student_id', me.id)
    .maybeSingle();
  if (!enrollment) return fail('You are not enrolled in this class');

  // Block updates once graded.
  const { data: existing } = await admin
    .from('submissions')
    .select('id, grade')
    .eq('assignment_id', assignment.id)
    .eq('student_id', me.id)
    .maybeSingle();
  if (existing?.grade !== null && existing?.grade !== undefined) {
    return fail('This submission was already graded and cannot be edited');
  }

  const payload = {
    assignment_id: assignment.id,
    student_id: me.id,
    text_answer: parsed.data.text_answer || null,
    file_url: parsed.data.file_url || null,
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = existing
    ? await admin.from('submissions').update(payload).eq('id', existing.id).select('id').single()
    : await admin.from('submissions').insert(payload).select('id').single();
  if (error || !data) return fail(error?.message ?? 'Could not submit');

  revalidatePath(`/learn/assignments/${assignment.id}`);
  revalidatePath(`/learn/classes/${assignment.class_id}`);
  revalidatePath(`/teach/classes/${assignment.class_id}`);
  return ok({ id: data.id });
}

const GradeSchema = z.object({
  id: z.string().uuid(),
  grade: z.coerce.number().int().min(0).max(100),
  feedback: z.string().trim().max(4000).optional().or(z.literal('')),
});

export async function gradeSubmissionAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'teacher') return fail('Not permitted');
  const parsed = GradeSchema.safeParse({
    id: formData.get('id'),
    grade: formData.get('grade'),
    feedback: formData.get('feedback') ?? '',
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const admin = getServiceSupabase();
  const { data: submission } = await admin
    .from('submissions')
    .select('id, assignment:assignments(id, class_id)')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (!submission) return fail('Submission not found');
  const assignment = Array.isArray(submission.assignment)
    ? submission.assignment[0]
    : submission.assignment;
  if (!assignment) return fail('Submission not found');

  const { data: teaches } = await admin
    .from('class_teachers')
    .select('class_id')
    .eq('class_id', assignment.class_id)
    .eq('teacher_id', me.id)
    .maybeSingle();
  if (!teaches) return fail('Not permitted for this class');

  const { error } = await admin
    .from('submissions')
    .update({
      grade: parsed.data.grade,
      feedback: parsed.data.feedback || null,
      graded_at: new Date().toISOString(),
      graded_by: me.id,
    })
    .eq('id', parsed.data.id);
  if (error) return fail(error.message);

  revalidatePath(`/teach/classes/${assignment.class_id}`);
  revalidatePath(`/learn/assignments/${assignment.id}`);
  return ok();
}

export async function listSubmissionsForAssignment(assignmentId: string) {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('submissions')
    .select('*, student:profiles(id, full_name, username)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });
  return data ?? [];
}

export async function getMySubmission(assignmentId: string, studentId: string) {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .maybeSingle();
  return data ?? null;
}

export async function listSubmissionsForStudent(studentId: string) {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('submissions')
    .select('*, assignment:assignments(id, title, class_id, class:classes(id, name))')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });
  return data ?? [];
}
