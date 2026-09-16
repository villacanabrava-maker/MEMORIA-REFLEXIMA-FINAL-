-- Testes de isolamento de RLS para public.profiles.
-- Rodar com `supabase test db` (requer Supabase CLI + Docker local).
-- A extensão pgtap já vem habilitada no template de testes do Supabase CLI.

begin;
select plan(6);

-- Dois usuários de teste; o trigger on_auth_user_created deve criar o
-- profile de cada um automaticamente.
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'rls-test-user-a@example.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'rls-test-user-b@example.test');

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'trigger cria o profile do usuário A automaticamente'
);

select is(
  (select count(*)::int from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'trigger cria o profile do usuário B automaticamente'
);

-- A partir daqui, simula uma requisição autenticada como o usuário A.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

select is(
  (select count(*)::int from public.profiles),
  1,
  'usuário A só enxerga o próprio profile ao listar sem filtro'
);

select is(
  (select count(*)::int from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'usuário A não consegue ler o profile do usuário B'
);

with attempt as (
  update public.profiles set display_name = 'invadido-por-a'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  returning id
)
select is(
  (select count(*)::int from attempt),
  0,
  'usuário A não consegue atualizar o profile do usuário B'
);

with attempt as (
  update public.profiles set display_name = 'nome-da-usuaria-a'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  returning id
)
select is(
  (select count(*)::int from attempt),
  1,
  'usuário A consegue atualizar o próprio profile'
);

select * from finish();
rollback;
