import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/shell/app-shell';
import { signOutAction } from '@/lib/auth/actions';
import { getCurrentProfile } from '@/lib/data/profile';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentProfile();
  if (me.role !== 'super_admin') redirect('/login');
  return (
    <AppShell
      user={{ id: me.id, name: me.full_name ?? me.username, username: me.username, role: me.role }}
      title="Admin"
      signOut={signOutAction}
    >
      {children}
    </AppShell>
  );
}
