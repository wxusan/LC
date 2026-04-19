import { PageHeader } from '@/components/ui/page-header';
import { listPeople } from '@/lib/data/people';
import { getServiceSupabase } from '@/lib/supabase/server';
import type { UserRole, UserStatus } from '@/lib/supabase/types';

import { PeopleTable } from './people-table';

export const metadata = { title: 'People — Admin' };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { role?: string; status?: string; lc?: string; q?: string };
}) {
  const role = (searchParams.role as UserRole | undefined) || undefined;
  const status = (searchParams.status as UserStatus | undefined) || undefined;
  const [people, lcs] = await Promise.all([
    listPeople({ role, status, lcId: searchParams.lc || undefined, search: searchParams.q }),
    (async () => {
      const admin = getServiceSupabase();
      const { data } = await admin.from('learning_centers').select('id, name').order('name');
      return data ?? [];
    })(),
  ]);
  return (
    <div>
      <PageHeader title="People" subtitle="Every user across the platform." />
      <PeopleTable
        people={people}
        lcs={lcs}
        currentFilters={{ role, status, lc: searchParams.lc, q: searchParams.q }}
      />
    </div>
  );
}
