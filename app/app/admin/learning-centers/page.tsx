import { PageHeader } from '@/components/ui/page-header';
import { getServiceSupabase } from '@/lib/supabase/server';

import { LcList } from './lc-list';

export const metadata = { title: 'Learning Centers — Admin' };

export default async function LearningCentersPage() {
  const admin = getServiceSupabase();
  const { data: lcs } = await admin
    .from('learning_centers')
    .select('*')
    .order('created_at', { ascending: false });

  const counts = await Promise.all(
    (lcs ?? []).map(async (lc) => {
      const [{ count: teachers }, { count: students }, { count: classes }] = await Promise.all([
        admin.from('profiles').select('id', { count: 'exact', head: true }).eq('learning_center_id', lc.id).eq('role', 'teacher'),
        admin.from('profiles').select('id', { count: 'exact', head: true }).eq('learning_center_id', lc.id).eq('role', 'student'),
        admin.from('classes').select('id', { count: 'exact', head: true }).eq('learning_center_id', lc.id),
      ]);
      return { lcId: lc.id, teachers: teachers ?? 0, students: students ?? 0, classes: classes ?? 0 };
    }),
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.lcId, c]));

  return (
    <div>
      <PageHeader title="Learning Centers" subtitle="Every tenant on the platform." />
      <LcList items={lcs ?? []} counts={countMap} />
    </div>
  );
}
