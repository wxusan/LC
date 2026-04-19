'use client';
import { useEffect, type ReactNode } from 'react';

import { Icon } from './icon';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  footer?: ReactNode;
  width?: number;
  mobile?: boolean;
  children: ReactNode;
}

export function Modal({ open, onClose, title, footer, width = 460, mobile, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.48)',
        zIndex: 70,
        animation: 'fadeBg var(--motion-default) var(--ease)',
        display: 'flex',
        alignItems: mobile ? 'flex-end' : 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          width: mobile ? '100%' : width,
          maxWidth: mobile ? '100%' : '90%',
          borderRadius: mobile ? '8px 8px 0 0' : 'var(--radius-lg)',
          boxShadow: 'var(--elev-lg)',
          overflow: 'hidden',
          animation: mobile ? 'slideInBottom var(--motion-default) var(--ease)' : 'fadeIn var(--motion-default) var(--ease)',
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--muted-foreground)',
              display: 'flex',
            }}
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </header>
        <div style={{ padding: 18, overflow: 'auto' }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              background: 'var(--subtle)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
