import { PageHeader } from '@/components/ui/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { getCurrentProfile } from '@/lib/data/profile';

export const metadata = { title: 'Profile — Admin' };

export default async function AdminProfilePage() {
  const me = await getCurrentProfile();
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your super admin account." />
      <ProfileForm me={me} />
    </div>
  );
}
