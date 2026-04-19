'use client';
import type { ReactNode } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';

export interface TopBarUser {
  id: string;
  name: string;
}

export interface TopBarProps {
  title: ReactNode;
  user: TopBarUser;
  mobile?: boolean;
  onMenuClick?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
}

export function TopBar({ title, user, mobile, onMenuClick, showBack, onBack, actions }: TopBarProps) {
  return (
    <header
      style={{
        height: 48,
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: mobile ? '0 12px' : '0 24px',
        flexShrink: 0,
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {mobile && !showBack && (
          <button
            onClick={onMenuClick}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--foreground)',
              display: 'flex',
            }}
            aria-label="Menu"
          >
            <Icon name="menu" size={18} />
          </button>
        )}
        {mobile && showBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
            }}
          >
            <Icon name="arrow-left" size={16} />
          </button>
        )}
        <div
          style={{
            fontSize: mobile ? 15 : 14,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {actions}
        {!mobile && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 2,
              background: 'var(--subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            {(['EN', 'RU', 'UZ'] as const).map((l) => (
              <div
                key={l}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 2,
                  background: l === 'EN' ? 'var(--card)' : 'transparent',
                  color: l === 'EN' ? 'var(--primary)' : 'var(--muted-foreground)',
                  border: l === 'EN' ? '1px solid var(--border)' : '1px solid transparent',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                }}
              >
                {l}
              </div>
            ))}
          </div>
        )}
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-foreground)',
            padding: 6,
            cursor: 'pointer',
            display: 'flex',
            position: 'relative',
          }}
          aria-label="Notifications"
        >
          <Icon name="bell" size={16} />
        </button>
        <Avatar name={user.name} size={26} userId={user.id} />
      </div>
    </header>
  );
}
