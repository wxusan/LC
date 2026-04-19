'use client';
import { useId, type CSSProperties, type InputHTMLAttributes } from 'react';

import { Icon, type IconName } from './icon';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'style'> {
  label?: string;
  optional?: boolean;
  help?: string;
  error?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconClick?: () => void;
  prefix?: string;
  style?: CSSProperties;
}

export function Input({
  label,
  optional,
  help,
  error,
  leftIcon,
  rightIcon,
  onRightIconClick,
  prefix,
  style,
  ...rest
}: InputProps) {
  const id = useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...(style || {}) }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>
          {label}
          {optional && <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}> (Optional)</span>}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${error ? 'var(--destructive)' : 'var(--border-strong)'}`,
          background: 'var(--card)',
          borderRadius: 'var(--radius-md)',
          transition: 'border-color var(--motion-fast) var(--ease), box-shadow var(--motion-fast) var(--ease)',
        }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${
            error ? '#fca5a5' : 'rgba(31,58,104,0.12)'
          }`;
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        {leftIcon && (
          <span style={{ paddingLeft: 10, color: 'var(--muted-foreground)', display: 'flex' }}>
            <Icon name={leftIcon} size={14} />
          </span>
        )}
        {prefix && (
          <span style={{ paddingLeft: 10, color: 'var(--muted-foreground)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            {prefix}
          </span>
        )}
        <input
          id={id}
          {...rest}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '7px 10px',
            fontSize: 13,
            background: 'transparent',
            minWidth: 0,
          }}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0 10px',
              color: 'var(--muted-foreground)',
              display: 'flex',
            }}
          >
            <Icon name={rightIcon} size={14} />
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: 'var(--destructive)' }}>{error}</div>}
      {help && !error && <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{help}</div>}
    </div>
  );
}
