import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  const parsed = parsePhoneNumberFromString(raw, 'UZ');
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export function maskPhone(phone: string): string {
  if (phone.length < 5) return phone;
  const head = phone.slice(0, phone.length - 4);
  return `${head.replace(/\d(?=\d{3})/g, '•')}${phone.slice(-4)}`;
}
