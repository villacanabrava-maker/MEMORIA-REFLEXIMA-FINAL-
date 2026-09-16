-- Migration 001b: as funções de trigger de public.profiles não são
-- utilidades de API — só devem rodar como efeito colateral de INSERT/UPDATE.
-- O linter do Supabase aponta handle_new_user (SECURITY DEFINER) como
-- executável via RPC por anon/authenticated; revogamos isso explicitamente.

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
