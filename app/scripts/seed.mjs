// Seed demo data against a Supabase instance.
//
//   Usage:  node scripts/seed.mjs
//
// Requires .env.local with:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Assumes 06-database-schema.sql has already been applied.
//
// Creates:
//   * 1 super_admin   — phone +998777777777, username "super",   password "Passw0rd!"
//   * 1 learning_center ("Sunrise Academy")
//   * 1 lc_admin      — phone +998901111111, username "admin",   password "Passw0rd!"
//   * 1 teacher       — phone +998902222222, username "teacher", password "Passw0rd!"
//   * 2 students      — phone +998903333333 / +998904444444, usernames "malika" / "javokhir"
//   * 1 class with both students enrolled and the teacher assigned
//   * 2 assignments (one with a sample submission)
//
// Dev OTP bypass: when SMS_PROVIDER=mock (the default), the code "000000"
// is always accepted for any phone. So after seeding you can log in with
// phone = +998 77 777 77 77 (super), code = 000000.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env.local by hand so we don't need dotenv.
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envText = readFileSync(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  console.error(`Could not read ${envPath}. Create it from .env.example first.`);
  process.exit(1);
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } });

const DEFAULT_PASSWORD = 'Passw0rd!';

async function upsertAuthUser({ email, password, phone }) {
  // Try to find by email first.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone,
    phone_confirm: true,
  });
  if (error) throw new Error(`Create auth user ${email}: ${error.message}`);
  return data.user;
}

async function upsertProfile(row) {
  const { error } = await admin.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Upsert profile ${row.username}: ${error.message}`);
}

async function run() {
  console.log('>>> seeding LC platform');

  // 1. Super admin — no LC.
  const superUser = await upsertAuthUser({
    email: 'super@lc.internal',
    password: DEFAULT_PASSWORD,
    phone: '+998777777777',
  });
  await upsertProfile({
    id: superUser.id,
    phone_number: '+998777777777',
    username: 'super',
    full_name: 'Sardor Super',
    role: 'super_admin',
    status: 'active',
    learning_center_id: null,
    locale: 'en',
  });
  console.log(' + super_admin @super  / Passw0rd!');

  // 2. Learning center.
  let { data: lc } = await admin
    .from('learning_centers')
    .select('*')
    .eq('slug', 'sunrise')
    .maybeSingle();
  if (!lc) {
    const { data, error } = await admin
      .from('learning_centers')
      .insert({ name: 'Sunrise Academy', slug: 'sunrise', status: 'active' })
      .select('*')
      .single();
    if (error) throw new Error(`Create LC: ${error.message}`);
    lc = data;
  }
  console.log(` + learning_center "${lc.name}" (${lc.slug})`);

  // 3. LC admin.
  const lcAdmin = await upsertAuthUser({
    email: 'admin@lc.internal',
    password: DEFAULT_PASSWORD,
    phone: '+998901111111',
  });
  await upsertProfile({
    id: lcAdmin.id,
    phone_number: '+998901111111',
    username: 'admin',
    full_name: 'Aziza Admin',
    role: 'lc_admin',
    status: 'active',
    learning_center_id: lc.id,
    locale: 'ru',
  });
  console.log(' + lc_admin   @admin  / Passw0rd!');

  // 4. Teacher.
  const teacher = await upsertAuthUser({
    email: 'teacher@lc.internal',
    password: DEFAULT_PASSWORD,
    phone: '+998902222222',
  });
  await upsertProfile({
    id: teacher.id,
    phone_number: '+998902222222',
    username: 'teacher',
    full_name: 'Temur Teacher',
    role: 'teacher',
    status: 'active',
    learning_center_id: lc.id,
    locale: 'ru',
  });
  console.log(' + teacher    @teacher / Passw0rd!');

  // 5. Two students.
  const student1 = await upsertAuthUser({
    email: 'malika@lc.internal',
    password: DEFAULT_PASSWORD,
    phone: '+998903333333',
  });
  await upsertProfile({
    id: student1.id,
    phone_number: '+998903333333',
    username: 'malika',
    full_name: 'Malika Student',
    role: 'student',
    status: 'active',
    learning_center_id: lc.id,
    locale: 'uz',
  });
  const student2 = await upsertAuthUser({
    email: 'javokhir@lc.internal',
    password: DEFAULT_PASSWORD,
    phone: '+998904444444',
  });
  await upsertProfile({
    id: student2.id,
    phone_number: '+998904444444',
    username: 'javokhir',
    full_name: 'Javokhir Student',
    role: 'student',
    status: 'active',
    learning_center_id: lc.id,
    locale: 'uz',
  });
  console.log(' + students   @malika, @javokhir / Passw0rd!');

  // 6. Class + enrollments.
  let { data: cls } = await admin
    .from('classes')
    .select('*')
    .eq('learning_center_id', lc.id)
    .eq('name', 'IELTS Preparation — Morning')
    .maybeSingle();
  if (!cls) {
    const { data, error } = await admin
      .from('classes')
      .insert({
        learning_center_id: lc.id,
        name: 'IELTS Preparation — Morning',
        subject: 'English',
        level: 'B2 → C1',
        schedule: 'Mon/Wed/Fri 08:00',
        status: 'active',
      })
      .select('*')
      .single();
    if (error) throw new Error(`Create class: ${error.message}`);
    cls = data;
  }
  await admin.from('class_teachers').upsert({ class_id: cls.id, teacher_id: teacher.id });
  await admin.from('class_students').upsert({ class_id: cls.id, student_id: student1.id });
  await admin.from('class_students').upsert({ class_id: cls.id, student_id: student2.id });
  console.log(` + class      "${cls.name}" with 2 students + 1 teacher`);

  // 7. Assignments.
  const due1 = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  const due2 = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const { data: existingA } = await admin
    .from('assignments')
    .select('id, title')
    .eq('class_id', cls.id);
  let a1 = existingA?.find((a) => a.title === 'Essay: AI in education');
  if (!a1) {
    const { data, error } = await admin
      .from('assignments')
      .insert({
        class_id: cls.id,
        teacher_id: teacher.id,
        title: 'Essay: AI in education',
        description:
          'Write a 250-word opinion essay: "Will AI replace teachers in the next 10 years?" Submit as plain text here or a link to a Google Doc.',
        due_at: due1,
      })
      .select('*')
      .single();
    if (error) throw new Error(`Create assignment 1: ${error.message}`);
    a1 = data;
  }
  let a2 = existingA?.find((a) => a.title === 'Vocabulary list — Unit 3');
  if (!a2) {
    const { error } = await admin
      .from('assignments')
      .insert({
        class_id: cls.id,
        teacher_id: teacher.id,
        title: 'Vocabulary list — Unit 3',
        description: 'Submit 20 sentences using vocabulary from Unit 3.',
        due_at: due2,
      });
    if (error) throw new Error(`Create assignment 2: ${error.message}`);
  }

  // 8. One submission from malika (ungraded, for teacher to grade).
  const { data: existingSub } = await admin
    .from('submissions')
    .select('id')
    .eq('assignment_id', a1.id)
    .eq('student_id', student1.id)
    .maybeSingle();
  if (!existingSub) {
    await admin.from('submissions').insert({
      assignment_id: a1.id,
      student_id: student1.id,
      text_answer:
        'In my opinion, AI will not fully replace teachers within the next ten years, but the role of the teacher will change...',
      submitted_at: new Date().toISOString(),
    });
  }
  console.log(' + assignments + 1 pending submission to grade');

  console.log('\nDone. Log in at http://localhost:3000/login :');
  console.log('   username login:   @super   / Passw0rd!   (super admin)');
  console.log('   username login:   @admin   / Passw0rd!   (lc admin)');
  console.log('   username login:   @teacher / Passw0rd!   (teacher)');
  console.log('   username login:   @malika  / Passw0rd!   (student)');
  console.log('   username login:   @javokhir/ Passw0rd!   (student)');
  console.log('');
  console.log(' Phone login (use code 000000 in mock mode — always works):');
  console.log('   +998 77 777 77 77   super admin');
  console.log('   +998 90 111 11 11   lc admin');
  console.log('   +998 90 222 22 22   teacher');
  console.log('   +998 90 333 33 33   student (Malika)');
  console.log('   +998 90 444 44 44   student (Javokhir)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
