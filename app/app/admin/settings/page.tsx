import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Settings — Admin' };

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform-wide defaults." />
      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>SMS provider</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 10 }}>
            Configure the SMS gateway via environment variables:
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginLeft: 4 }}>
              SMS_PROVIDER, ESKIZ_EMAIL, ESKIZ_PASSWORD, ESKIZ_FROM
            </code>.
          </div>
          <Row label="Current" value={process.env.SMS_PROVIDER ?? 'mock'} />
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Invitation TTL</div>
          <Row label="Current" value={`${process.env.INVITATION_TTL_DAYS ?? 7} days`} />
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>OTP</div>
          <Row label="TTL" value={`${Math.round(Number(process.env.OTP_TTL_SECONDS ?? 300) / 60)} min`} />
          <Row label="Max attempts / 30 min" value={process.env.OTP_MAX_ATTEMPTS ?? '5'} />
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 4 }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{value}</span>
    </div>
  );
}
