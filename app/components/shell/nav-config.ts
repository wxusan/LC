import type { IconName } from '@/components/ui/icon';
import type { UserRole } from '@/lib/supabase/types';

export interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  sub?: boolean;
}

export interface ClassLink {
  id: string;
  name: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  lc_admin: 'LC Admin',
  teacher: 'Teacher',
  student: 'Student',
};

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/admin',
  lc_admin: '/lc',
  teacher: '/teach',
  student: '/learn',
};

export const PROFILE_HREF: Record<UserRole, string> = {
  super_admin: '/admin/profile',
  lc_admin: '/lc/profile',
  teacher: '/teach/profile',
  student: '/learn/profile',
};

export function navForRole(role: UserRole, classes: ClassLink[] = []): NavItem[] {
  switch (role) {
    case 'super_admin':
      return [
        { key: 'overview', label: 'Overview', icon: 'home', href: '/admin' },
        { key: 'lcs', label: 'Learning Centers', icon: 'building', href: '/admin/learning-centers' },
        { key: 'people', label: 'People', icon: 'users', href: '/admin/people' },
        { key: 'settings', label: 'Settings', icon: 'settings', href: '/admin/settings' },
      ];
    case 'lc_admin':
      return [
        { key: 'overview', label: 'Overview', icon: 'home', href: '/lc' },
        { key: 'teachers', label: 'Teachers', icon: 'graduation', href: '/lc/teachers' },
        { key: 'students', label: 'Students', icon: 'users', href: '/lc/students' },
        { key: 'classes', label: 'Classes', icon: 'book-open', href: '/lc/classes' },
        { key: 'settings', label: 'Settings', icon: 'settings', href: '/lc/settings' },
      ];
    case 'teacher':
      return [
        { key: 'dashboard', label: 'Dashboard', icon: 'home', href: '/teach' },
        ...classes.map((c) => ({
          key: `class:${c.id}`,
          label: c.name,
          icon: 'book-open' as IconName,
          href: `/teach/classes/${c.id}`,
          sub: true,
        })),
      ];
    case 'student':
      return [
        { key: 'dashboard', label: 'Dashboard', icon: 'home', href: '/learn' },
        ...classes.map((c) => ({
          key: `class:${c.id}`,
          label: c.name,
          icon: 'book-open' as IconName,
          href: `/learn/classes/${c.id}`,
          sub: true,
        })),
      ];
  }
}
