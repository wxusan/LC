'use client';
import { useEffect, useState, type ReactNode } from 'react';

import type { ClassLink } from './nav-config';
import { Sidebar, type SidebarUser } from './sidebar';
import { TopBar } from './top-bar';

export interface AppShellProps {
  user: SidebarUser;
  classes?: ClassLink[];
  title: ReactNode;
  children: ReactNode;
  signOut: () => void | Promise<void>;
  actions?: ReactNode;
}

export function AppShell({ user, classes = [], title, children, signOut, actions }: AppShellProps) {
  const [mobile, setMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!mobile) setMobileOpen(false);
  }, [mobile]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!mobile && <Sidebar user={user} classes={classes} signOut={signOut} />}

      {mobile && mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.32)',
            zIndex: 50,
            animation: 'fadeBg var(--motion-default) var(--ease)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 260,
              animation: 'slideInLeft var(--motion-default) var(--ease)',
              background: 'var(--card)',
              boxShadow: 'var(--elev-lg)',
            }}
          >
            <Sidebar
              user={user}
              classes={classes}
              mobile
              onClose={() => setMobileOpen(false)}
              signOut={signOut}
            />
          </div>
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title={title}
          user={user}
          mobile={mobile}
          onMenuClick={() => setMobileOpen(true)}
          actions={actions}
        />
        <div
          className="page-root"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: mobile ? 16 : 24,
            background: 'var(--background)',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
