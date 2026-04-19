import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/shell/app-shell';
import { signOutAction } from '@/lib/auth/actions';
import { getCurrentProfile } from '@/lib/data/profile';

export default async function LcLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentProfile();
  if (me.role !== 'lc_admin') redirect('/login');
  return (
    <AppShell
      user={{ id: me.id, name: me.full_name ?? me.username, username: me.username, role: me.role }}
      title="Learning Center"
      signOut={signOutAction}
    >
      {children}
    </AppShell>
  );
}
