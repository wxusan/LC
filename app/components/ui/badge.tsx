import type { ReactNode } from 'react';

type Palette = { bg: string; fg: string; dot: string };

const COLORS: Record<string, Palette> = {
  neutral:   { bg: 'var(--muted)',            fg: 'var(--muted-foreground)',       dot: '#94a3b8' },
  active:    { bg: 'var(--success-soft)',     fg: 'var(--success-soft-foreground)', dot: 'var(--success)' },
  pending:   { bg: 'var(--warning-soft)',     fg: 'var(--warning-soft-foreground)', dot: 'var(--warning)' },
  invited:   { bg: 'var(--info-soft)',        fg: 'var(--info-soft-foreground)',    dot: 'var(--info)' },
  suspended: { bg: 'var(--destructive-soft)', fg: 'var(--destructive-soft-foreground)', dot: 'var(--destructive)' },
  archived:  { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  cancelled: { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  expired:   { bg: 'var(--destructive-soft)', fg: 'var(--destructive-soft-foreground)', dot: 'var(--destructive)' },
  draft:     { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
  submitted: { bg: 'var(--info-soft)',    fg: 'var(--info-soft-foreground)',    dot: 'var(--info)' },
  graded:    { bg: 'var(--success-soft)', fg: 'var(--success-soft-foreground)', dot: 'var(--success)' },
  'role-super_admin': { bg: '#f3efff', fg: '#5b3fa8',          dot: '#6b4fbb' },
  'role-lc_admin':    { bg: '#eef2f9', fg: 'var(--primary)',   dot: 'var(--primary)' },
  'role-teacher':     { bg: '#ecfdf5', fg: '#0f766e',          dot: '#0f766e' },
  'role-student':     { bg: '#fff8ed', fg: '#b54708',          dot: '#b54708' },
};

export type BadgeVariant = keyof typeof COLORS | string;

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  uppercase?: boolean;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', size = 'sm', dot, uppercase, children }: BadgeProps) {
  const c = COLORS[variant] ?? COLORS.neutral;
  const isRole = typeof variant === 'string' && variant.startsWith('role-');
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 500,
        background: c.bg,
        color: c.fg,
        borderRadius: isRole ? 2 : 'var(--radius-sm)',
        letterSpacing: uppercase ? '0.04em' : 0,
        textTransform: uppercase ? 'uppercase' : 'none',
        border: isRole ? `1px solid ${c.dot}22` : 'none',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot }} />}
      {children}
    </span>
  );
}
