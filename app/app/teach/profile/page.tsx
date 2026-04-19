import { PageHeader } from '@/components/ui/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { getCurrentProfile } from '@/lib/data/profile';

export const metadata = { title: 'Profile — Teacher' };

export default async function TeacherProfilePage() {
  const me = await getCurrentProfile();
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your teacher account." />
      <ProfileForm me={me} />
    </div>
  );
}
