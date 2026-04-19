'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: string | number;
}

export function Card({ children, style, onClick, hoverable, padding = 'var(--space-loose)' }: CardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding,
        boxShadow: hover ? 'var(--elev-sm)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease)',
        borderColor: hover ? 'var(--border-strong)' : 'var(--border)',
        ...(style || {}),
      }}
    >
      {children}
    </div>
  );
}

export interface KPIProps {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
}

export function KPI({ label, value, delta, hint }: KPIProps) {
  return (
    <Card padding="16px 18px">
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        {delta && (
          <div
            style={{
              fontSize: 11,
              color: delta.startsWith('+') ? 'var(--success)' : 'var(--destructive)',
              fontWeight: 500,
            }}
          >
            {delta}
          </div>
        )}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{hint}</div>}
    </Card>
  );
}
