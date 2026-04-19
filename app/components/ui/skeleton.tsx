import type { CSSProperties } from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        background: 'var(--muted)',
        borderRadius: 3,
        animation: 'pulse 1.4s ease-in-out infinite',
        ...(style || {}),
      }}
    />
  );
}
