'use client';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

import { Icon, type IconName } from './icon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'destructive-ghost'
  | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    fontWeight: 500,
    letterSpacing: '-0.005em',
    transition: `background var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease), color var(--motion-fast) var(--ease)`,
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };
  const sizes: Record<ButtonSize, CSSProperties> = {
    sm: { padding: '4px 10px', fontSize: 12, height: 26 },
    md: { padding: '6px 12px', fontSize: 13, height: 32 },
    lg: { padding: '8px 16px', fontSize: 14, height: 40 },
  };
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--primary)' },
    secondary: { background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--foreground)' },
    destructive: { background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderColor: 'var(--destructive)' },
    'destructive-ghost': { background: 'transparent', color: 'var(--destructive)' },
    link: { background: 'transparent', color: 'var(--primary)', padding: 0, height: 'auto' },
  };
  return (
    <button
      type={rest.type ?? 'button'}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...(style || {}) }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        const el = e.currentTarget;
        if (variant === 'primary') el.style.background = 'var(--primary-hover)';
        if (variant === 'destructive') el.style.background = 'var(--destructive-hover)';
        if (variant === 'secondary') el.style.background = 'var(--subtle)';
        if (variant === 'ghost') el.style.background = 'var(--muted)';
        if (variant === 'destructive-ghost') el.style.background = 'var(--destructive-soft)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (variant === 'primary') el.style.background = 'var(--primary)';
        if (variant === 'destructive') el.style.background = 'var(--destructive)';
        if (variant === 'secondary') el.style.background = 'var(--card)';
        if (variant === 'ghost') el.style.background = 'transparent';
        if (variant === 'destructive-ghost') el.style.background = 'transparent';
      }}
      {...rest}
    >
      {loading ? (
        <Icon name="refresh" size={14} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        leftIcon && <Icon name={leftIcon} size={size === 'sm' ? 12 : 14} />
      )}
      {children}
      {rightIcon && !loading && <Icon name={rightIcon} size={size === 'sm' ? 12 : 14} />}
    </button>
  );
}
