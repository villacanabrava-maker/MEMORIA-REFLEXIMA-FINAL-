-- Testes de isolamento de RLS para memória histórica
-- (memory_imports, historical_reflections, historical_reflection_chunks)
-- e para a busca semântica filtrada por usuário.
-- Rodar com `supabase test db` (requer Supabase CLI + Docker local).

begin;
select plan(6);

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'rls-test-user-a@example.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'rls-test-user-b@example.test');

insert into public.memory_imports (id, user_id, storage_path, original_filename, mime_type, status)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a.txt', 'a.txt', 'text/plain', 'completed'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/b.txt', 'b.txt', 'text/plain', 'completed');

insert into public.historical_reflections (id, user_id, memory_import_id, title, body)
values
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Memoria de A', 'texto de A'),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Memoria de B', 'texto de B');

-- Os dois chunks têm o mesmo embedding: se a busca semântica de A
-- devolver algo de B, o teste de isolamento abaixo pega.
insert into public.historical_reflection_chunks (user_id, historical_reflection_id, chunk_index, content, embedding, embedding_model, embedding_dimensions)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 0, 'chunk de A', (select array_fill(0.1::real, array[1536]))::extensions.vector(1536), 'text-embedding-3-small', 1536),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 0, 'chunk de B', (select array_fill(0.1::real, array[1536]))::extensions.vector(1536), 'text-embedding-3-small', 1536);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

select is(
  (select count(*)::int from public.memory_imports),
  1,
  'usuário A só enxerga a própria importação'
);

select is(
  (select count(*)::int from public.historical_reflections),
  1,
  'usuário A só enxerga a própria memória histórica'
);

select is(
  (select count(*)::int from public.historical_reflection_chunks),
  1,
  'usuário A só enxerga o próprio chunk'
);

select is(
  (select count(*)::int from public.match_historical_reflection_chunks(
    (select array_fill(0.1::real, array[1536]))::extensions.vector(1536), 0.0, 10
  )),
  1,
  'busca semântica de A não retorna chunk de B mesmo com embedding idêntico'
);

with attempt as (
  update public.memory_imports set status = 'failed'
  where id = '22222222-2222-2222-2222-222222222222'
  returning id
)
select is((select count(*)::int from attempt), 0, 'usuário A não altera a importação de B');

select throws_ok(
  $$insert into public.historical_reflections (user_id, title, body) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'x', 'y')$$,
  '42501',
  'usuário autenticado não escreve diretamente em historical_reflections (só a Edge Function via service role)'
);

select * from finish();
rollback;
