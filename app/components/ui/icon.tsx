import type { CSSProperties, SVGProps } from 'react';

type IconPaths = Record<string, JSX.Element>;

const PATHS: IconPaths = {
  user: (<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>),
  'user-plus': (<><circle cx="10" cy="8" r="4"/><path d="M2 21c0-4.4 3.6-8 8-8 1.4 0 2.7.4 3.9 1"/><path d="M19 11v6M16 14h6"/></>),
  users: (<><circle cx="9" cy="8" r="4"/><path d="M1 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M17 11a4 4 0 0 0 0-8"/><path d="M23 21c0-3.6-2.2-6.8-5-7.7"/></>),
  building: (<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-4h4v4"/></>),
  'book-open': (<><path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></>),
  graduation: (<><path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></>),
  file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></>),
  clipboard: (<><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></>),
  phone: (<><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z"/></>),
  message: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
  key: (<><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3"/><path d="m18 5 3 3"/><path d="m15 8 3 3"/></>),
  lock: (<><rect x="3" y="11" width="18" height="11" rx="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  'log-out': (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>),
  plus: (<><path d="M12 5v14M5 12h14"/></>),
  x: (<><path d="M18 6 6 18M6 6l12 12"/></>),
  search: (<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>),
  filter: (<><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></>),
  sliders: (<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></>),
  pencil: (<><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></>),
  trash: (<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></>),
  archive: (<><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></>),
  'shield-off': (<><path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1 1 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m2 2 20 20"/></>),
  download: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>),
  upload: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>),
  file2: (<><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 7h6M9 11h6M9 15h4"/></>),
  check: (<><path d="m20 6-11 11-5-5"/></>),
  'check-circle': (<><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></>),
  'x-circle': (<><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></>),
  'alert-triangle': (<><path d="M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></>),
  'alert-circle': (<><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>),
  info: (<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>),
  'chevron-right': (<><path d="m9 6 6 6-6 6"/></>),
  'chevron-left': (<><path d="m15 6-6 6 6 6"/></>),
  'chevron-down': (<><path d="m6 9 6 6 6-6"/></>),
  'chevron-up': (<><path d="m6 15 6-6 6 6"/></>),
  globe: (<><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>),
  settings: (<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),
  menu: (<><path d="M4 6h16M4 12h16M4 18h16"/></>),
  eye: (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>),
  'eye-off': (<><path d="M17.9 17.9A11 11 0 0 1 12 20c-7 0-11-8-11-8a20.4 20.4 0 0 1 5.2-6.1M9.9 4.2A11 11 0 0 1 12 4c7 0 11 8 11 8a20.5 20.5 0 0 1-2.3 3.4M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="m2 2 20 20"/></>),
  more: (<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>),
  clock: (<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/></>),
  bell: (<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>),
  home: (<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>),
  layout: (<><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M3 9h18"/></>),
  list: (<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>),
  'arrow-left': (<><path d="M19 12H5M12 19l-7-7 7-7"/></>),
  'arrow-right': (<><path d="M5 12h14M12 5l7 7-7 7"/></>),
  'arrow-up-right': (<><path d="M7 17 17 7M7 7h10v10"/></>),
  refresh: (<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  'file-spreadsheet': (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M10 13v4"/></>),
  copy: (<><rect x="9" y="9" width="13" height="13" rx="1"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
  send: (<><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>),
  paperclip: (<><path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></>),
  inbox: (<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></>),
  activity: (<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>),
  star: (<><path d="m12 2 3.1 6.3 7 1-5 4.9 1.1 7L12 17.8 5.7 21l1.2-7-5-4.9 7-1z"/></>),
};

export type IconName = keyof typeof PATHS | string;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, strokeWidth = 1.75, style, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
