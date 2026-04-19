'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { UserRole } from '@/lib/supabase/types';

import { type ClassLink, navForRole, PROFILE_HREF, ROLE_LABELS } from './nav-config';

export interface SidebarUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface SidebarProps {
  user: SidebarUser;
  classes?: ClassLink[];
  mobile?: boolean;
  onClose?: () => void;
  signOut: () => void | Promise<void>;
}

type Lang = 'EN' | 'RU' | 'UZ';

export function Sidebar({ user, classes = [], mobile, onClose, signOut }: SidebarProps) {
  const pathname = usePathname() ?? '';
  const items = navForRole(user.role, classes);
  const [lang, setLang] = useState<Lang>('EN');

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/lc' || href === '/teach' || href === '/learn') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      style={{
        width: mobile ? '100%' : 220,
        height: '100%',
        background: 'var(--card)',
        borderRight: mobile ? 'none' : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '14px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: 'var(--primary)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '-0.04em',
            }}
          >
            LC
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.015em' }}>Learning Center</div>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      <div style={{ padding: '0 10px', marginBottom: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            background: 'var(--subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          <Badge variant={`role-${user.role}`} size="sm" uppercase>
            {ROLE_LABELS[user.role]}
          </Badge>
        </div>
      </div>

      <div style={{ padding: '0 10px', flex: 1, overflow: 'auto' }}>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => mobile && onClose?.()}
              className={`nav-item ${active ? 'active' : ''}`}
              style={{
                textDecoration: 'none',
                paddingLeft: item.sub ? 26 : 10,
                marginBottom: 1,
              }}
            >
              <Icon name={item.icon} size={item.sub ? 12 : 15} />
              <span
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
        <Link
          href={PROFILE_HREF[user.role]}
          onClick={() => mobile && onClose?.()}
          className="nav-item"
          style={{ padding: '6px 8px', textDecoration: 'none' }}
        >
          <Avatar name={user.name} size={24} userId={user.id} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--foreground)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              @{user.username}
            </div>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {(['EN', 'RU', 'UZ'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                flex: 1,
                background: lang === l ? 'var(--accent)' : 'transparent',
                border: '1px solid var(--border)',
                color: lang === l ? 'var(--primary)' : 'var(--muted-foreground)',
                fontSize: 10,
                fontWeight: 600,
                padding: '4px 0',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            style={{
              marginTop: 6,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              fontSize: 11,
              borderRadius: 'var(--radius-md)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--muted)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--muted-foreground)';
            }}
          >
            <Icon name="log-out" size={12} /> Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
