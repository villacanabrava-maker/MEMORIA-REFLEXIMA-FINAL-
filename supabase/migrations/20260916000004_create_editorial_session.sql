-- Migration 004: Sessão editorial
-- Uma reflection_session por dia de trabalho, com no máximo uma fonte e
-- um comentário associados (1:1) nesta etapa. Geração e aprovação chegam
-- em migrations futuras.

create table public.reflection_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_sources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.reflection_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_date date not null,
  author text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reflection_comments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.reflection_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reflection_sessions enable row level security;
alter table public.daily_sources enable row level security;
alter table public.reflection_comments enable row level security;

create policy "reflection_sessions_select_own"
  on public.reflection_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "reflection_sessions_insert_own"
  on public.reflection_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "reflection_sessions_update_own"
  on public.reflection_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "daily_sources_select_own"
  on public.daily_sources for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "daily_sources_insert_own"
  on public.daily_sources for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "daily_sources_update_own"
  on public.daily_sources for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "reflection_comments_select_own"
  on public.reflection_comments for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "reflection_comments_insert_own"
  on public.reflection_comments for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "reflection_comments_update_own"
  on public.reflection_comments for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger set_reflection_sessions_updated_at
  before update on public.reflection_sessions
  for each row execute function public.set_updated_at();

create trigger set_daily_sources_updated_at
  before update on public.daily_sources
  for each row execute function public.set_updated_at();

create trigger set_reflection_comments_updated_at
  before update on public.reflection_comments
  for each row execute function public.set_updated_at();

create index reflection_sessions_user_date_idx
  on public.reflection_sessions (user_id, session_date desc);
