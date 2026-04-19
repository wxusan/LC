import type { ReactNode } from 'react';

import { Icon, type IconName } from './icon';

export interface EmptyStateProps {
  icon?: IconName;
  heading: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon = 'inbox', heading, body, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 360, margin: '0 auto' }}>
      <div
        style={{
          width: 40,
          height: 40,
          margin: '0 auto 12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted-foreground)',
        }}
      >
        <Icon name={icon} size={18} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{heading}</div>
      {body && (
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: action ? 16 : 0 }}>
          {body}
        </div>
      )}
      {action}
    </div>
  );
}
