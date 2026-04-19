'use client';
import { Icon, type IconName } from './icon';

export interface FabProps {
  icon?: IconName;
  label?: string;
  onClick?: () => void;
  mobile?: boolean;
}

export function Fab({ icon = 'plus', label, onClick, mobile }: FabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: mobile ? 20 : 24,
        right: mobile ? 20 : 24,
        height: 48,
        padding: label ? '0 18px 0 14px' : '0 14px',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: mobile ? 999 : 'var(--radius-md)',
        boxShadow: 'var(--elev-lg)',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        zIndex: 30,
        transition: 'transform var(--motion-fast) var(--ease), box-shadow var(--motion-fast) var(--ease)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}
