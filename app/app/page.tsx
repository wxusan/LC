import { redirect } from 'next/navigation';

// Middleware redirects authed users to their role home; unauthed → /login.
// This page only runs if middleware lets the request through somehow.
export default function Home() {
  redirect('/login');
}
