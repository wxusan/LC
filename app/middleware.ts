// Route gating. Architecture §4: every role has its own URL prefix.
// - Unauthed users hitting a protected route → /login
// - Authed users hitting /login → redirected to their role home
// - Authed users hitting the wrong role prefix → redirected to their role home
import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';
import type { UserRole } from '@/lib/supabase/types';

const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/admin',
  lc_admin: '/lc',
  teacher: '/teach',
  student: '/learn',
};

const ROLE_PREFIX: Record<UserRole, string> = {
  super_admin: '/admin',
  lc_admin: '/lc',
  teacher: '/teach',
  student: '/learn',
};

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/reset',
  '/reset/confirm',
  '/privacy',
  '/terms',
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/invite/')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/api/public')) return true;
  if (pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2?)$/)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Unauthenticated
  if (!user) {
    if (isPublic(pathname)) return response;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — fetch role
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as { role: UserRole; status: string } | null;

  // Suspended / archived → force sign-out
  if (profile?.status === 'suspended' || profile?.status === 'archived') {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'account_suspended');
    return NextResponse.redirect(url);
  }

  // If user never completed profile creation (shouldn't happen with invite flow)
  if (!profile) {
    return response;
  }

  const home = ROLE_HOME[profile.role];

  // Auth pages for a logged-in user → punt them home
  if (pathname === '/login' || pathname === '/' || pathname === '/reset' || pathname === '/reset/confirm') {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  // Cross-role access → send home
  const myPrefix = ROLE_PREFIX[profile.role];
  const otherPrefixes = Object.values(ROLE_PREFIX).filter((p) => p !== myPrefix);
  if (otherPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
