'use client';
import { useEffect, type ReactNode } from 'react';

import { Icon } from './icon';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  status?: ReactNode;
  footer?: ReactNode;
  width?: number;
  mobile?: boolean;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, status, footer, width = 520, mobile, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.32)',
          animation: 'fadeBg var(--motion-default) var(--ease)',
          zIndex: 40,
        }}
      />
      <aside
        style={{
          position: 'fixed',
          ...(mobile
            ? { left: 0, right: 0, bottom: 0, top: 60, animation: 'slideInBottom var(--motion-default) var(--ease)' }
            : { top: 0, right: 0, bottom: 0, width, animation: 'slideInRight var(--motion-default) var(--ease)' }),
          background: 'var(--card)',
          boxShadow: 'var(--elev-lg)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          borderLeft: '1px solid var(--border)',
        }}
      >
        <header
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>
            {status}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--muted-foreground)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
            }}
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </header>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
        {footer && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '12px 18px',
              display: 'flex',
              gap: 8,
              justifyContent: 'space-between',
              background: 'var(--subtle)',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
