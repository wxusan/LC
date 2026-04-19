'use client';
import type { ReactNode } from 'react';

export interface TabDef<V extends string = string> {
  value: V;
  label: ReactNode;
  count?: number;
}

export interface TabsProps<V extends string = string> {
  tabs: TabDef<V>[];
  value: V;
  onChange: (v: V) => void;
}

export function Tabs<V extends string = string>({ tabs, value, onChange }: TabsProps<V>) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease)',
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--muted-foreground)',
                  fontWeight: 500,
                  background: 'var(--muted)',
                  padding: '0px 6px',
                  borderRadius: 999,
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
