// All Supabase auth users in this MVP are backed by a synthetic email so we
// can use `admin.generateLink({ type: 'magiclink', email })` to issue sessions
// regardless of which login method the user used.
//
// - Phone-only users (created via OTP): `p{digits}@lc.phone`
// - Username/password users (created by invite): `{username}@lc.internal`

export function phoneToSyntheticEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `p${digits}@lc.phone`;
}

export function usernameToSyntheticEmail(username: string): string {
  return `${username.toLowerCase()}@lc.internal`;
}
