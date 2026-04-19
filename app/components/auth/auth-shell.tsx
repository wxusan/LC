import type { ReactNode } from 'react';

export interface AuthShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--background)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--elev-sm)',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              background: 'var(--primary)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '-0.04em',
            }}
          >
            LC
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Learning Center
          </div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20 }}>
            {subtitle}
          </p>
        )}
        <div style={{ marginTop: subtitle ? 0 : 16 }}>{children}</div>
        {footer && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              marginTop: 20,
              paddingTop: 14,
              fontSize: 12,
              color: 'var(--muted-foreground)',
              textAlign: 'center',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
