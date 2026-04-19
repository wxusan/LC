'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server';

import { getCurrentProfile } from './profile';
import { fail, ok, type ActionResult } from './result';

const slugRx = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(slugRx, 'slug must be lowercase letters, digits, hyphens'),
});

export async function createLearningCenterAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me.role !== 'super_admin') return fail('Only super admins can create learning centers');

  const parsed = CreateSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const admin = getServiceSupabase();
  const { data: existing } = await admin
    .from('learning_centers')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle();
  if (existing) return fail('Slug is taken');

  const { data, error } = await admin
    .from('learning_centers')
    .insert({ name: parsed.data.name, slug: parsed.data.slug, status: 'active' })
    .select('id')
    .single();
  if (error) return fail(error.message);

  revalidatePath('/admin/learning-centers');
  revalidatePath('/admin');
  return ok({ id: data.id });
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().toLowerCase().regex(slugRx).optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
});

export async function updateLearningCenterAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'super_admin') return fail('Only super admins can update learning centers');

  const parsed = UpdateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name') || undefined,
    slug: formData.get('slug') || undefined,
    status: formData.get('status') || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input');

  const { id, ...patch } = parsed.data;
  const admin = getServiceSupabase();
  const { error } = await admin.from('learning_centers').update(patch).eq('id', id);
  if (error) return fail(error.message);

  revalidatePath('/admin/learning-centers');
  revalidatePath('/admin');
  return ok();
}

export async function archiveLearningCenterAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.role !== 'super_admin') return fail('Only super admins can archive learning centers');
  const id = String(formData.get('id') ?? '');
  if (!id) return fail('Missing id');

  const admin = getServiceSupabase();
  const { error } = await admin.from('learning_centers').update({ status: 'suspended' }).eq('id', id);
  if (error) return fail(error.message);
  revalidatePath('/admin/learning-centers');
  return ok();
}

// Read helpers
export async function listLearningCenters() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('learning_centers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function getLcCounts(lcId: string) {
  const admin = getServiceSupabase();
  const [{ count: teachers }, { count: students }, { count: classes }] = await Promise.all([
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('learning_center_id', lcId)
      .eq('role', 'teacher'),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('learning_center_id', lcId)
      .eq('role', 'student'),
    admin
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('learning_center_id', lcId),
  ]);
  return {
    teachers: teachers ?? 0,
    students: students ?? 0,
    classes: classes ?? 0,
  };
}
