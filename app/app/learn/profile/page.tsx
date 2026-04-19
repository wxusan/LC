import { PageHeader } from '@/components/ui/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { getCurrentProfile } from '@/lib/data/profile';

export const metadata = { title: 'Profile — Student' };

export default async function StudentProfilePage() {
  const me = await getCurrentProfile();
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your student account." />
      <ProfileForm me={me} />
    </div>
  );
}
