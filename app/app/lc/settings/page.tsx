import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentProfile } from '@/lib/data/profile';
import { getServiceSupabase } from '@/lib/supabase/server';

export const metadata = { title: 'Settings — LC' };

export default async function LcSettingsPage() {
  const me = await getCurrentProfile();
  if (!me.learning_center_id) return null;
  const admin = getServiceSupabase();
  const { data: lc } = await admin
    .from('learning_centers')
    .select('*')
    .eq('id', me.learning_center_id)
    .maybeSingle();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your learning center's details." />
      <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Learning center</div>
          <Row label="Name" value={lc?.name ?? '—'} />
          <Row label="Slug" value={lc?.slug ?? '—'} mono />
          <Row label="Status" value={lc?.status ?? '—'} />
          <Row label="Created" value={lc ? new Date(lc.created_at).toLocaleDateString() : '—'} />
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 10 }}>
            Contact support to change the name or slug.
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : undefined, fontSize: mono ? 12 : 13 }}>{value}</span>
    </div>
  );
}
