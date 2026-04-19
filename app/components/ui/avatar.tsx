export interface AvatarProps {
  name?: string | null;
  size?: number;
  userId?: string;
}

const PALETTE = ['#1f3a68', '#0f766e', '#b54708', '#6b4fbb', '#475569', '#b42318', '#0284c7'];

export function Avatar({ name, size = 28, userId }: AvatarProps) {
  const initials = (name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const source = userId || name || '';
  const hash = source.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = PALETTE[hash % PALETTE.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-full)',
        background: bg,
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '-0.01em',
      }}
    >
      {initials}
    </div>
  );
}
