import { PageHeader } from '@/components/ui/page-header';
import { listPeople } from '@/lib/data/people';
import { getCurrentProfile } from '@/lib/data/profile';

import { LcInviteFab } from '../lc-invite-fab';
import { LcPeopleList } from '../lc-people-list';

export const metadata = { title: 'Students — LC' };

export default async function StudentsPage() {
  const me = await getCurrentProfile();
  const people = await listPeople({ role: 'student', lcId: me.learning_center_id ?? undefined });
  return (
    <div>
      <PageHeader title="Students" subtitle="Learners at your learning center." />
      <LcPeopleList people={people} emptyHeading="No students yet" emptyIcon="users" currentUserId={me.id} />
      <LcInviteFab />
    </div>
  );
}
