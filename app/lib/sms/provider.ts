import 'server-only';

export interface SmsProvider {
  name: string;
  send(to: string, text: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

class MockSmsProvider implements SmsProvider {
  name = 'mock';
  async send(to: string, text: string) {
    // eslint-disable-next-line no-console
    console.log(`[sms:mock] to=${to} text=${text}`);
    return { ok: true } as const;
  }
}

interface EskizTokenCache {
  token: string;
  expiresAt: number;
}

class EskizSmsProvider implements SmsProvider {
  name = 'eskiz';
  private tokenCache: EskizTokenCache | null = null;

  constructor(
    private email: string,
    private password: string,
    private from?: string,
    private baseUrl = 'https://notify.eskiz.uz/api',
  ) {}

  private async token(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }
    const body = new URLSearchParams({ email: this.email, password: this.password });
    const res = await fetch(`${this.baseUrl}/auth/login`, { method: 'POST', body });
    if (!res.ok) throw new Error(`Eskiz auth failed: ${res.status}`);
    const json = (await res.json()) as { data?: { token?: string } };
    const token = json.data?.token;
    if (!token) throw new Error('Eskiz auth: no token');
    // Eskiz tokens last ~30 days; cache for 25 days.
    this.tokenCache = { token, expiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000 };
    return token;
  }

  async send(to: string, text: string) {
    try {
      const token = await this.token();
      const body = new URLSearchParams({
        mobile_phone: to.replace(/^\+/, ''),
        message: text,
        ...(this.from ? { from: this.from } : {}),
      });
      const res = await fetch(`${this.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return { ok: false as const, error: `Eskiz send failed ${res.status}: ${errText}` };
      }
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    }
  }
}

let cached: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (cached) return cached;
  const kind = (process.env.SMS_PROVIDER ?? 'mock').toLowerCase();
  if (kind === 'eskiz') {
    const email = process.env.ESKIZ_EMAIL;
    const password = process.env.ESKIZ_PASSWORD;
    const from = process.env.ESKIZ_FROM;
    if (!email || !password) {
      console.warn('[sms] Eskiz requested but ESKIZ_EMAIL / ESKIZ_PASSWORD missing; falling back to mock');
      cached = new MockSmsProvider();
    } else {
      cached = new EskizSmsProvider(email, password, from);
    }
  } else {
    cached = new MockSmsProvider();
  }
  return cached;
}
