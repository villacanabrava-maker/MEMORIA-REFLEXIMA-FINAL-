-- Migration 003 (Memória): pgvector + memory_imports, historical_reflections
-- e historical_reflection_chunks, com busca semântica filtrada por RLS.

create extension if not exists vector with schema extensions;

create table public.memory_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.historical_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  memory_import_id uuid references public.memory_imports (id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.historical_reflection_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  historical_reflection_id uuid not null references public.historical_reflections (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding extensions.vector(1536),
  embedding_model text,
  embedding_dimensions int,
  pipeline_version text not null default 'v1',
  created_at timestamptz not null default now(),
  unique (historical_reflection_id, chunk_index)
);

alter table public.memory_imports enable row level security;
alter table public.historical_reflections enable row level security;
alter table public.historical_reflection_chunks enable row level security;

-- memory_imports: o usuário inicia e acompanha a importação.
create policy "memory_imports_select_own"
  on public.memory_imports for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "memory_imports_insert_own"
  on public.memory_imports for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "memory_imports_update_own"
  on public.memory_imports for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- historical_reflections e chunks são escritos pela Edge Function
-- (service role, contorna RLS); o usuário só lê o próprio conteúdo.
create policy "historical_reflections_select_own"
  on public.historical_reflections for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "historical_reflection_chunks_select_own"
  on public.historical_reflection_chunks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger set_memory_imports_updated_at
  before update on public.memory_imports
  for each row execute function public.set_updated_at();

create trigger set_historical_reflections_updated_at
  before update on public.historical_reflections
  for each row execute function public.set_updated_at();

create index historical_reflection_chunks_embedding_idx
  on public.historical_reflection_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create index historical_reflections_user_idx
  on public.historical_reflections (user_id, created_at desc);

-- Busca semântica: SECURITY INVOKER (padrão) para que o RLS de
-- historical_reflection_chunks filtre automaticamente pelo usuário
-- autenticado que chamou a função, sem precisar receber user_id do cliente.
create function public.match_historical_reflection_chunks(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id uuid,
  historical_reflection_id uuid,
  content text,
  similarity float
)
language sql
stable
set search_path = public, extensions
as $$
  select
    c.id,
    c.historical_reflection_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.historical_reflection_chunks c
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit least(match_count, 50);
$$;

revoke execute on function public.match_historical_reflection_chunks from public;
grant execute on function public.match_historical_reflection_chunks to authenticated;
