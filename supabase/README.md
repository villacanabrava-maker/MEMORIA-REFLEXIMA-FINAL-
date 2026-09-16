# Supabase

Esta pasta guarda o que é versionado junto ao código: migrations SQL e Edge Functions.

O Supabase CLI não está disponível neste ambiente de execução, então `config.toml` e o conteúdo das migrations/functions ainda não foram gerados. Eles serão criados a partir do Lote 2 (Semana 4 do `docs/PLANO_CONSTRUCAO_NOVO_APLICATIVO.md`), quando os projetos Supabase de desenvolvimento e produção existirem, rodando localmente:

```bash
supabase init
supabase link --project-ref <ref-do-projeto-dev>
supabase migration new <nome>
```

As pastas abaixo já existem como placeholders da estrutura oficial (seção 6 do plano) e serão preenchidas lote a lote:

- `migrations/` — migrations 001 a 008 (identidade, perfil autoral, memória, sessão editorial, geração/revisão, jobs, mídia, storage).
- `functions/` — uma pasta por Edge Function planejada (`transcribe`, `generate-reflection`, `build-author-profile`, `approve-reflection`, `generate-audio`, `ingest-memory-file`, `extract-source-text`, e as de mídia posteriores).
- `tests/` — testes de RLS, grants, triggers e concorrência do banco.
