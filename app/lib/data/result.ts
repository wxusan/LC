export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? {} : { data: T }))
  | { ok: false; error: string };

export function ok(): { ok: true };
export function ok<T>(data: T): { ok: true; data: T };
export function ok<T>(data?: T) {
  return data === undefined ? { ok: true as const } : { ok: true as const, data };
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false as const, error };
}
