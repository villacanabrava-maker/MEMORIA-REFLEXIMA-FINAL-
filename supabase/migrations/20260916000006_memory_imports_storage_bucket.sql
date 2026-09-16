-- Migration 008 (Storage, parte memória): bucket privado para os
-- arquivos originais importados como memória histórica. Cada objeto vive
-- em "<user_id>/<arquivo>", e as policies restringem cada usuário à
-- própria pasta.

insert into storage.buckets (id, name, public)
values ('memory-imports', 'memory-imports', false)
on conflict (id) do nothing;

create policy "memory_imports_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'memory-imports'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "memory_imports_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'memory-imports'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
