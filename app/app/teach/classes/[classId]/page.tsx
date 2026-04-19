import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/page-header';
import { listAssignmentsForClass } from '@/lib/data/assignments';
import { getClassWithCounts } from '@/lib/data/classes';
import { getCurrentProfile } from '@/lib/data/profile';
import { getServiceSupabase } from '@/lib/supabase/server';

import { ClassTabs } from './class-tabs';

export const metadata = { title: 'Class — Teacher' };

export default async function TeachClassPage({
  params,
  searchParams,
}: {
  params: { classId: string };
  searchParams: { tab?: string };
}) {
  const me = await getCurrentProfile();
  const admin = getServiceSupabase();
  const { data: assignment } = await admin
    .from('class_teachers')
    .select('class_id')
    .eq('class_id', params.classId)
    .eq('teacher_id', me.id)
    .maybeSingle();
  if (!assignment) notFound();

  const { cls, students } = await getClassWithCounts(params.classId);
  if (!cls) notFound();
  const assignments = await listAssignmentsForClass(params.classId);

  // All submissions for this class' assignments.
  const assignmentIds = assignments.map((a) => a.id);
  const { data: submissions } = await admin
    .from('submissions')
    .select('*, student:profiles(id, full_name, username)')
    .in('assignment_id', assignmentIds.length ? assignmentIds : ['00000000-0000-0000-0000-000000000000']);

  return (
    <div>
      <PageHeader title={cls.name} subtitle={cls.schedule ?? cls.level ?? undefined} />
      <ClassTabs
        classId={cls.id}
        className={cls.name}
        students={students}
        assignments={assignments}
        submissions={submissions ?? []}
        activeTab={searchParams.tab ?? 'students'}
      />
    </div>
  );
}
