import { PageHeader } from '@/components/ui/page-header';
import { listPeople } from '@/lib/data/people';
import { getCurrentProfile } from '@/lib/data/profile';

import { LcInviteFab } from '../lc-invite-fab';
import { LcPeopleList } from '../lc-people-list';

export const metadata = { title: 'Teachers — LC' };

export default async function TeachersPage() {
  const me = await getCurrentProfile();
  const people = await listPeople({ role: 'teacher', lcId: me.learning_center_id ?? undefined });
  return (
    <div>
      <PageHeader title="Teachers" subtitle="Educators at your learning center." />
      <LcPeopleList people={people} emptyHeading="No teachers yet" emptyIcon="graduation" currentUserId={me.id} />
      <LcInviteFab />
    </div>
  );
}
