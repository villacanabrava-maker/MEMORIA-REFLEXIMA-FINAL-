-- Testes de isolamento de RLS para a sessão editorial
-- (reflection_sessions, daily_sources, reflection_comments).
-- Rodar com `supabase test db` (requer Supabase CLI + Docker local).

begin;
select plan(8);

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'rls-test-user-a@example.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'rls-test-user-b@example.test');

insert into public.reflection_sessions (id, user_id)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.daily_sources (session_id, user_id, title, source_date, body)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fonte de A', current_date, 'texto de A'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fonte de B', current_date, 'texto de B');

insert into public.reflection_comments (session_id, user_id, body)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comentario de A'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'comentario de B');

-- A partir daqui, simula uma requisição autenticada como o usuário A.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

select is(
  (select count(*)::int from public.reflection_sessions),
  1,
  'usuário A só enxerga a própria sessão'
);

select is(
  (select count(*)::int from public.daily_sources),
  1,
  'usuário A só enxerga a própria fonte'
);

select is(
  (select count(*)::int from public.reflection_comments),
  1,
  'usuário A só enxerga o próprio comentário'
);

with attempt as (
  update public.daily_sources set title = 'invadido'
  where session_id = '22222222-2222-2222-2222-222222222222'
  returning id
)
select is((select count(*)::int from attempt), 0, 'usuário A não altera a fonte de B');

with attempt as (
  update public.reflection_comments set body = 'invadido'
  where session_id = '22222222-2222-2222-2222-222222222222'
  returning id
)
select is((select count(*)::int from attempt), 0, 'usuário A não altera o comentário de B');

with attempt as (
  update public.reflection_sessions set session_date = '2000-01-01'
  where id = '22222222-2222-2222-2222-222222222222'
  returning id
)
select is((select count(*)::int from attempt), 0, 'usuário A não altera a sessão de B');

select throws_ok(
  $$insert into public.reflection_sessions (id, user_id) values ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  '42501',
  'usuário A não consegue criar sessão em nome de B'
);

with attempt as (
  update public.daily_sources set title = 'editado-por-a'
  where session_id = '11111111-1111-1111-1111-111111111111'
  returning id
)
select is((select count(*)::int from attempt), 1, 'usuário A consegue editar a própria fonte');

select * from finish();
rollback;
