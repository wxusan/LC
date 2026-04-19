'use client';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import { Icon } from './icon';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  msg: string;
  variant: ToastVariant;
  action?: ToastAction;
}

interface ToastContextValue {
  push: (msg: string, variant?: ToastVariant, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback<ToastContextValue['push']>((msg, variant = 'success', action) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, variant, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 8000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${
                t.variant === 'error'
                  ? 'var(--destructive)'
                  : t.variant === 'warning'
                    ? 'var(--warning)'
                    : t.variant === 'info'
                      ? 'var(--info)'
                      : 'var(--success)'
              }`,
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              boxShadow: 'var(--elev-lg)',
              fontSize: 13,
              maxWidth: 320,
              animation: 'fadeIn 200ms var(--ease)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Icon
              name={
                t.variant === 'error'
                  ? 'x-circle'
                  : t.variant === 'warning'
                    ? 'alert-triangle'
                    : t.variant === 'info'
                      ? 'info'
                      : 'check-circle'
              }
              size={14}
              style={{
                color:
                  t.variant === 'error'
                    ? 'var(--destructive)'
                    : t.variant === 'warning'
                      ? 'var(--warning)'
                      : t.variant === 'info'
                        ? 'var(--info)'
                        : 'var(--success)',
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>{t.msg}</span>
            {t.action && (
              <button
                onClick={t.action.onClick}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
