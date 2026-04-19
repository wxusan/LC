import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/shell/app-shell';
import { signOutAction } from '@/lib/auth/actions';
import { listClassesForStudent } from '@/lib/data/classes';
import { getCurrentProfile } from '@/lib/data/profile';

export default async function LearnLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentProfile();
  if (me.role !== 'student') redirect('/login');
  const classes = await listClassesForStudent(me.id);
  return (
    <AppShell
      user={{ id: me.id, name: me.full_name ?? me.username, username: me.username, role: me.role }}
      classes={classes.map((c) => ({ id: c.id, name: c.name }))}
      title="Student"
      signOut={signOutAction}
    >
      {children}
    </AppShell>
  );
}
