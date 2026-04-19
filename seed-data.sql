-- Seed data with demo users (run this in Supabase SQL Editor)

insert into learning_centers (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Einstein Academy', 'einstein-academy');

insert into profiles (id, phone_number, username, full_name, role, learning_center_id, locale, status) values
  ('6b98de66-c503-43eb-84fb-d83c0fe1247b', '+998000000001', 'dilnoza',  'Dilnoza Karimova',  'lc_admin', '11111111-1111-1111-1111-111111111111', 'uz', 'active'),
  ('abc6a2d3-4695-47c5-8e96-b0e518fa4ec9', '+998000000002', 'javohir',  'Javohir Tursunov',  'teacher',  '11111111-1111-1111-1111-111111111111', 'uz', 'active'),
  ('0924cef6-6c94-44d1-8d81-71b949fa2b19', '+998000000004', 'malika',   'Malika Rashidova',  'student',  '11111111-1111-1111-1111-111111111111', 'uz', 'active');

insert into classes (id, learning_center_id, name, subject, level, schedule) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'IELTS Intermediate', 'English', 'B1', 'Mon/Wed 18:00-20:00'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'SAT Math Prep',      'Math',    'Advanced', 'Tue/Thu 19:00-21:00');

insert into class_teachers (class_id, teacher_id) values
  ('22222222-2222-2222-2222-222222222221', 'abc6a2d3-4695-47c5-8e96-b0e518fa4ec9');

insert into class_students (class_id, student_id) values
  ('22222222-2222-2222-2222-222222222221', '0924cef6-6c94-44d1-8d81-71b949fa2b19');

insert into assignments (id, class_id, teacher_id, title, description, due_at) values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'abc6a2d3-4695-47c5-8e96-b0e518fa4ec9',
   'Essay: My favorite book', 'Write 250 words about a book that changed how you think.', now() + interval '5 days');
