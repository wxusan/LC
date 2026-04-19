import { PageHeader } from '@/components/ui/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { getCurrentProfile } from '@/lib/data/profile';

export const metadata = { title: 'Profile — LC' };

export default async function LcProfilePage() {
  const me = await getCurrentProfile();
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your LC admin account." />
      <ProfileForm me={me} />
    </div>
  );
}
