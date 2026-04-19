import 'server-only';
import { createHash, randomInt } from 'node:crypto';

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(phone: string, code: string): string {
  const salt = process.env.OTP_HASH_SALT ?? 'lc-local-salt';
  return createHash('sha256').update(`${phone}:${code}:${salt}`).digest('hex');
}

export const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS ?? 300);
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
export const OTP_LOCKOUT_MINUTES = Number(process.env.OTP_LOCKOUT_MINUTES ?? 30);

export function otpIsExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  return Date.now() - created > OTP_TTL_SECONDS * 1000;
}
