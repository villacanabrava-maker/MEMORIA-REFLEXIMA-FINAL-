# Memória Reflexiva

Aplicativo para produzir uma reflexão autoral diária a partir de uma fonte, um
comentário pessoal e a memória histórica do próprio autor, com apoio de IA e
aprovação humana obrigatória.

O roteiro completo de construção — decisões técnicas, ambientes, banco de
dados, segurança, cronograma e ordem dos lotes — está em
[`docs/PLANO_CONSTRUCAO_NOVO_APLICATIVO.md`](docs/PLANO_CONSTRUCAO_NOVO_APLICATIVO.md).

Este repositório está no **Lote 1 — Fundação**: projeto Next.js, estrutura de
pastas, autenticação inicial via Supabase e CI. Os lotes seguintes (RLS
completa, sessão editorial, memória semântica, motor de geração, voz e mídia)
ainda não foram implementados.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui (componentes locais em `src/components/ui`)
- Supabase (Auth, Postgres, Storage, Edge Functions)
- TanStack Query, Zod, React Hook Form
- Vitest + Testing Library (unitário) e Playwright (E2E)

## Getting Started

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do projeto Supabase de DESENVOLVIMENTO
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Sem um projeto Supabase configurado em `.env.local`, a página inicial e o
cadastro/login carregam, mas as chamadas de autenticação falham — isso é
esperado até a Semana 2 do plano (criação dos ambientes Supabase).

## Scripts

```bash
npm run dev         # servidor de desenvolvimento
npm run build       # build de produção
npm run start       # servidor de produção (após build)
npm run lint         # ESLint
npm run typecheck   # tsc --noEmit
npm run test         # testes unitários (Vitest)
npm run test:watch  # testes unitários em modo watch
npm run test:e2e     # testes E2E (Playwright)
```

Antes de abrir um PR ou avançar de lote, rode lint, typecheck, test e build —
nessa ordem — e garanta que todos passem.

## Estrutura

```text
src/
  app/
    (public)/    rotas de autenticação: login, cadastro, recuperar/redefinir senha
    (protected)/ rotas autenticadas: início e as futuras telas do fluxo editorial
    auth/callback/  troca do código de confirmação/OAuth por sessão
  components/    ui (shadcn), auth, e placeholders para editorial/memory/media
  lib/
    supabase/    clientes de browser, servidor e o helper de sessão do proxy
    validation/  schemas Zod
  proxy.ts       renovação de sessão e proteção de rotas (Next.js Proxy)

supabase/        migrations e Edge Functions (a partir do Lote 2)
tests/           unit, integration e e2e
docs/            plano de construção e documentação do produto
```

## Variáveis de ambiente

Veja `.env.example`. Nunca use a `SUPABASE_SERVICE_ROLE_KEY` ou chaves de
OpenAI/ElevenLabs em código client-side — elas só podem ser lidas em Edge
Functions e código server-side.
