-- Migration 001c: Postgres concede EXECUTE a PUBLIC por padrão na criação
-- de uma função, e anon/authenticated herdam esse grant. A migration
-- anterior revogou de anon/authenticated diretamente, mas isso não bastou
-- enquanto PUBLIC continuasse com o grant.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
