# Plano de Construção — Memória Reflexiva (Novo Aplicativo)

## Finalidade deste documento

Este documento é o roteiro oficial para construir o aplicativo Memória Reflexiva do zero, como um produto greenfield organizado, independente e pronto para evolução.

A construção será feita em uma nova janela do VS Code, com um repositório GitHub, ambientes Supabase separados e publicação na Vercel.

Plataformas centrais:

- **VS Code:** ambiente de desenvolvimento e execução das tarefas.
- **GitHub:** versionamento, colaboração e CI.
- **Supabase:** autenticação, banco PostgreSQL, Storage e funções backend.
- **Vercel:** publicação do frontend e ambientes de Preview e Production.
- **OpenAI:** texto, embeddings, transcrição e imagens opcionais.
- **ElevenLabs:** narração e catálogo de vozes.

---

## 1. Objetivo do produto

O aplicativo ajudará uma pessoa a produzir uma reflexão autoral diária a partir de:

1. uma fonte recebida no dia;
2. um comentário pessoal escrito ou falado;
3. reflexões históricas do próprio autor;
4. um Perfil Autoral estruturado;
5. revisão e aprovação humana.

O fluxo principal será:

```text
Entrar
  -> cadastrar fonte
  -> escrever ou gravar comentário
  -> transcrever, se necessário
  -> gerar reflexão
  -> revisar e editar
  -> aprovar
  -> gerar narração
  -> ouvir e baixar
```

A inteligência artificial auxilia a produção. A pessoa continua sendo a autora e responsável pela aprovação final.

---

## 2. Decisões técnicas

### Frontend e aplicação web

- Next.js com App Router.
- React e TypeScript.
- Tailwind CSS.
- shadcn/ui e Radix UI para componentes acessíveis.
- Lucide React para ícones.
- TanStack Query para dados assíncronos quando necessário.
- Zod para validação de entradas.
- React Hook Form para formulários complexos.

### Hospedagem

- Vercel para o frontend Next.js.
- Preview automático para pull requests.
- Produção ligada à branch `main`.
- Variáveis públicas e privadas separadas por ambiente.

### Código e colaboração

- GitHub como fonte oficial do código.
- VS Code como ambiente de desenvolvimento.
- Agente de programação do VS Code para implementação assistida.
- Pull requests para alterações relevantes.
- Nenhum push forçado.
- Nenhuma alteração direta em produção sem aprovação.

### Backend

- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Row Level Security.
- Supabase Storage.
- Supabase Edge Functions com Deno.
- Supabase Realtime somente se a experiência exigir atualização instantânea.
- Extensão `pgvector` para memória semântica.

### Inteligência artificial

- OpenAI para geração de texto.
- OpenAI para transcrição de áudio.
- OpenAI para embeddings.
- OpenAI para geração opcional de imagens.

### Voz

- ElevenLabs para Text-to-Speech.
- ElevenLabs Voices API para listar vozes.
- A voz só será gerada depois da aprovação textual.

---

## 3. Plataformas, contas e conectores

### Obrigatórios

| Plataforma | Uso | Conector |
| --- | --- | --- |
| GitHub | Código, branches e pull requests | Git / GitHub Actions |
| VS Code | Desenvolvimento | Extensão do agente de programação |
| Vercel | Deploy do frontend | Integração GitHub/Vercel |
| Supabase Auth | Cadastro, login e recuperação de senha | `@supabase/ssr` e `@supabase/supabase-js` |
| Supabase Database | PostgreSQL, RLS, RPCs e pgvector | Supabase JS e migrations SQL |
| Supabase Storage | Áudios, documentos e mídia | Supabase Storage API |
| Supabase Edge Functions | Backend seguro e integração com providers | Deno/Supabase CLI |
| OpenAI | Texto, embeddings e transcrição | HTTPS API nas Edge Functions |
| ElevenLabs | Narração e vozes | HTTPS API nas Edge Functions |

### Opcional no MVP

| Plataforma | Uso | Quando adicionar |
| --- | --- | --- |
| Resend ou Postmark | Emails transacionais próprios | Somente se o email do Supabase não for suficiente |
| Sentry | Erros e monitoramento | Depois do fluxo principal funcionar |
| PostHog | Métricas de uso | Somente com decisão de privacidade aprovada |
| Serviço de liturgia | Evangelho do dia | Depois da entrada manual estar estável |
| Upstash Redis | Rate limiting externo | Se o rate limit no PostgreSQL não for suficiente |
| GitHub Actions | CI completa | Desde o início, com escopo mínimo |

### Regras de arquitetura

- Chaves secretas nunca ficam no frontend.
- Nunca colocar a service role key em variáveis `NEXT_PUBLIC_*`.
- Banco externo paralelo ao Supabase.
- WhatsApp no primeiro MVP.
- Vídeo generativo por movimento no primeiro MVP.

---

## 4. Ambientes necessários

Criar dois projetos Supabase separados:

### Desenvolvimento

Usado localmente e em previews da Vercel.

- dados sintéticos;
- chaves de teste;
- Storage de teste;
- migrations aplicadas automaticamente em ambiente controlado.

### Produção

Usado somente pelo domínio oficial.

- usuários reais;
- dados autorais reais;
- secrets reais;
- backups e PITR revisados;
- deploy aprovado manualmente.

Criar também dois ambientes na Vercel:

- Preview para pull requests;
- Production para `main`.

Nunca apontar Preview para o banco de produção.

---

## 5. Preparação da nova janela do VS Code

### 5.1 Instalar ferramentas

No Windows, instalar e validar:

- Git;
- Node.js LTS;
- npm;
- VS Code;
- Supabase CLI;
- GitHub CLI, opcional;
- Docker Desktop, para testes locais completos do Supabase.

Comandos de verificação:

```powershell
git --version
node --version
npm --version
supabase --version
docker --version
```

### 5.2 Criar o diretório novo

O projeto novo deve ficar em uma pasta diferente do repositório auditado.

```powershell
mkdir memoria-reflexiva-novo
cd memoria-reflexiva-novo
```

### 5.3 Criar o projeto Next.js

```powershell
npx create-next-app@latest .
```

Escolher:

- TypeScript: sim;
- ESLint: sim;
- Tailwind: sim;
- `src/`: sim;
- App Router: sim;
- Turbopack: sim, se estiver estável;
- import alias: `@/*`;
- React Compiler: conforme a versão validada do projeto.

### 5.4 Instalar dependências

```powershell
npm install @supabase/ssr @supabase/supabase-js
npm install @tanstack/react-query zod react-hook-form @hookform/resolvers
npm install lucide-react date-fns sonner
npx shadcn@latest init
```

Dependências de teste:

```powershell
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
```

### 5.5 Inicializar Git

```powershell
git init
git add .
git commit -m "chore: initialize new Memoria Reflexiva app"
```

Criar o repositório novo no GitHub e conectar o remote.

---

## 6. Estrutura inicial de pastas

```text
src/
  app/
    (public)/
      login/
      cadastro/
      recuperar-senha/
      redefinir-senha/
    (protected)/
      inicio/
      reflexoes/
      reflexoes/nova/
      reflexoes/[id]/
      historico/
      historico/[id]/
      memoria/
      memoria/[id]/
      perfil-autoral/
      configuracoes/
    auth/
      callback/
  components/
    ui/
    auth/
    editorial/
    memory/
    media/
  hooks/
  lib/
    supabase/
    validation/
    formatters/
    errors/
  types/
  styles/

supabase/
  config.toml
  migrations/
  functions/
    _shared/
    transcribe/
    generate-reflection/
    build-author-profile/
    approve-reflection/
    generate-audio/
    ingest-memory-file/
    extract-source-text/
    generate-reflection-image/
    generate-reflection-pdf/
  tests/

tests/
  unit/
  integration/
  e2e/

docs/
  PRODUCT_SPEC.md
  DATA_MODEL.md
  SECURITY.md
  API_CONTRACTS.md
  OPERATIONS.md
```

---

## 7. Configuração de variáveis

Criar `.env.example` sem valores reais:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=

OPENAI_API_KEY=
OPENAI_TEXT_MODEL=
OPENAI_EMBEDDING_MODEL=
OPENAI_TRANSCRIPTION_MODEL=

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

CREDENTIALS_ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=
```

Regras:

- `NEXT_PUBLIC_*` pode chegar ao navegador somente quando for público.
- `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser importada por componentes client-side.
- OpenAI e ElevenLabs só serão acessados em Edge Functions.
- `.env.local` não entra no Git.
- A Vercel terá valores diferentes para Preview e Production.

---

## 8. Banco de dados por etapas

### Migration 001 — Identidade

Criar:

```text
profiles
```

Adicionar trigger versionado para criar o perfil após novo usuário em `auth.users`.

### Migration 002 — Perfil autoral

Criar:

```text
author_profiles
author_profile_versions
author_profile_sources
```

### Migration 003 — Memória

Criar:

```text
memory_imports
historical_reflections
historical_reflection_chunks
```

Ativar `pgvector` e criar função de busca semântica filtrada por usuário.

### Migration 004 — Sessão editorial

Criar:

```text
reflection_sessions
daily_sources
reflection_comments
comment_audio_files
comment_transcriptions
comment_versions
```

### Migration 005 — Geração e revisão

Criar:

```text
generated_reflections
reflection_edits
retrieval_references
approved_reflections
```

### Migration 006 — Jobs

Criar:

```text
processing_jobs
work_claims
```

Adicionar leases, tentativas, expiração e estados de erro.

### Migration 007 — Mídia

Criar:

```text
generated_audio
reflection_pdfs
reflection_images
reflection_videos
video_scenes
```

### Migration 008 — Storage

Criar os buckets privados e suas policies diretamente em migration versionada.

---

## 9. Regras de Row Level Security

Cada tabela privada deve possuir policies baseadas em:

```sql
(select auth.uid()) = user_id
```

Regras essenciais:

- usuário só lê seus próprios dados;
- usuário só cria dados ligados ao próprio perfil;
- usuário não altera status editorial diretamente;
- usuário não insere aprovação diretamente;
- usuário não grava mídia processada diretamente;
- Edge Functions validam propriedade mesmo usando service role;
- RPCs sensíveis têm `REVOKE` para `anon` e `authenticated`;
- funções `SECURITY DEFINER` usam `search_path` vazio ou explicitamente controlado.

Criar testes negativos para:

- usuário A lendo dados de B;
- usuário A alterando sessão de B;
- usuário tentando aprovar geração de B;
- usuário tentando acessar arquivo de B;
- chamada direta a RPC privilegiada.

---

## 10. Construção da autenticação

Implementar nesta ordem:

1. cliente Supabase para browser;
2. cliente Supabase para servidor;
3. middleware de sessão;
4. login;
5. cadastro;
6. confirmação de email;
7. logout;
8. recuperação de senha;
9. redefinição de senha;
10. proteção das rotas autenticadas.

Critérios de aceite:

- visitante não acessa rotas protegidas;
- usuário autenticado consegue atualizar a sessão;
- logout limpa cache privado;
- recuperação de senha funciona com link real;
- usuário A não vê dados de usuário B.

---

## 11. Construção do fluxo editorial

### Etapa 1 — Painel

Criar `/inicio` com:

- saudação;
- data atual;
- sessões do dia;
- status de cada sessão;
- botão `Nova reflexão`;
- últimas reflexões aprovadas.

### Etapa 2 — Fonte

Criar formulário com:

- título;
- data;
- texto recebido;
- autoria/fonte;
- upload opcional de PDF, DOCX, TXT ou Markdown.

O upload deve extrair o texto sem substituir o arquivo original.

### Etapa 3 — Comentário

Permitir:

- texto escrito;
- gravação no navegador;
- reprodução do áudio;
- regravação;
- upload privado;
- transcrição;
- edição da transcrição.

A falha da transcrição não pode apagar o áudio nem impedir comentário manual.

### Etapa 4 — Geração

O frontend apenas solicita a geração. O estado verdadeiro será lido do banco.

Mostrar estados reais:

- aguardando;
- processando;
- pronto para revisão;
- falhou;
- concluído.

Não mostrar etapas artificiais que não existam no backend.

### Etapa 5 — Revisão

Exibir:

- versão gerada;
- outras versões;
- editor;
- histórico de edições;
- referências da memória usadas.

### Etapa 6 — Aprovação

A aprovação deverá exigir:

- sessão correta;
- geração pertencente à sessão;
- corpo não vazio;
- usuário autenticado;
- chamada idempotente.

Depois da aprovação, fonte, comentário, geração e aprovação ficam imutáveis.

---

## 12. Edge Functions planejadas

### `transcribe`

Recebe áudio, valida tamanho e formato, chama OpenAI e devolve transcrição.

Não grava a transcrição automaticamente sem associá-la a uma sessão autorizada.

### `generate-reflection`

Executa:

1. validação do usuário;
2. claim do job;
3. leitura da fonte;
4. leitura do comentário;
5. leitura do perfil ativo;
6. embedding da consulta;
7. busca semântica;
8. geração estruturada;
9. validação da resposta;
10. persistência da geração e referências;
11. conclusão do job.

### `build-author-profile`

Analisa reflexões selecionadas e cria uma nova versão de perfil em estado `draft`.

Nunca ativa o perfil automaticamente.

### `approve-reflection`

Chama uma RPC transacional de aprovação. Não aceita `user_id` enviado pelo navegador.

### `generate-audio`

Só aceita `approved_reflection_id`, valida propriedade, reivindica job e chama ElevenLabs.

### `ingest-memory-file`

Extrai, analisa, divide em chunks e cria embeddings.

### `extract-source-text`

Extrai texto para uso na sessão sem transformar automaticamente o arquivo em memória histórica.

### Mídia posterior

Adicionar depois do MVP textual:

- `generate-reflection-image`;
- `generate-reflection-pdf`;
- `generate-reflection-video`;
- `generate-video-scene`.

---

## 13. Contratos das APIs externas

### OpenAI — texto

Usar resposta estruturada em JSON para geração de reflexão e perfil.

Validar no servidor:

- JSON válido;
- título textual;
- corpo textual;
- limites de tamanho;
- ausência de campos inesperados.

### OpenAI — embeddings

Usar modelo de embeddings configurável por variável de ambiente.

Salvar em cada chunk:

- modelo usado;
- dimensão;
- data de criação;
- versão do pipeline.

### OpenAI — transcrição

- aceitar somente formatos permitidos;
- limitar tamanho;
- informar idioma português;
- não expor a API key;
- guardar texto original e edição separadamente.

### ElevenLabs — voz

- validar chave no backend;
- listar vozes da conta;
- salvar somente `voice_id` e preferências;
- nunca expor a chave depois de salva;
- aplicar retry somente em erros transitórios;
- não repetir 401 ou erro de conteúdo.

### Serviço do Evangelho

Será um conector opcional. A fonte manual sempre será o caminho principal.

O backend deverá validar se a data devolvida pela API corresponde à data solicitada.

---

## 14. Resiliência e custos

Todo processamento pago deverá ter:

- claim atômico;
- idempotency key;
- limite de tentativas;
- timeout;
- retry para rede, 429 e 5xx;
- nenhuma repetição para 4xx definitivos;
- estado `failed` com código técnico interno;
- mensagem amigável no frontend;
- registro de custo estimado;
- limite por usuário e por dia.

O backend nunca deve iniciar duas chamadas caras para a mesma operação lógica.

---

## 15. Testes obrigatórios antes da produção

### Local

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

### Banco

Executar migrations em banco Supabase local e testar:

- RLS;
- grants;
- triggers;
- constraints;
- aprovação;
- concorrência;
- Storage.

### E2E

Automatizar com Playwright:

- login;
- cadastro;
- recuperação;
- nova reflexão;
- comentário;
- geração simulada;
- edição;
- aprovação;
- histórico;
- logout.

As APIs pagas devem ser mockadas nos testes. Não usar chaves reais em CI.

---

## 16. Deploy na Vercel

1. Criar projeto na Vercel.
2. Importar o repositório novo do GitHub.
3. Configurar Node.js LTS.
4. Configurar variáveis de Preview.
5. Configurar variáveis de Production.
6. Configurar URL de callback do Supabase Auth.
7. Configurar domínio, se necessário.
8. Abrir pull request e validar Preview.
9. Executar testes.
10. Fazer merge em `main`.
11. Validar produção com usuário de teste.

O deploy do frontend não substitui o deploy das Edge Functions. As funções serão publicadas pelo Supabase CLI em pipeline controlado.

---

## 17. Cronograma executivo de construção

Este cronograma considera uma construção incremental em 16 semanas. As semanas podem ser ajustadas, mas a ordem das dependências deve ser preservada.

### Semana 1 — Produto e decisões

Entregáveis:

- nome provisório e objetivo do produto;
- público inicial;
- fluxo principal aprovado;
- lista do MVP;
- lista de recursos posteriores;
- critérios de aceite;
- política de privacidade e tratamento de dados autorais;
- definição de quem administrará GitHub, Supabase, OpenAI, ElevenLabs e Vercel.

Pronto quando: o escopo do MVP estiver escrito e não houver dúvida sobre o que fica fora da primeira versão.

### Semana 2 — Contas e ambientes

Entregáveis:

- novo repositório GitHub;
- projeto Supabase de desenvolvimento;
- projeto Supabase de produção;
- projeto Vercel;
- domínio ou URL provisória;
- secrets separados por ambiente;
- branch `main` protegida;
- CI inicial;
- documento `.env.example`.

Pronto quando: um commit simples gerar um Preview na Vercel e nenhum ambiente utilizar credenciais de outro ambiente.

### Semana 3 — Fundação do frontend

Entregáveis:

- projeto Next.js funcionando;
- layout base responsivo;
- navegação pública e protegida;
- componentes de formulário;
- tratamento de loading, erro e vazio;
- sistema visual inicial;
- lint, typecheck, teste e build funcionando.

Pronto quando: a aplicação abre localmente e no Preview sem erro de console ou build.

### Semana 4 — Auth e perfis

Entregáveis:

- cadastro;
- login;
- confirmação de email;
- logout;
- recuperação de senha;
- redefinição de senha;
- middleware de rotas protegidas;
- tabela `profiles`;
- trigger de criação de perfil;
- primeiro conjunto de policies RLS.

Pronto quando: um usuário consegue criar conta, confirmar email, entrar, sair e recuperar a senha em ambiente de desenvolvimento.

### Semana 5 — Banco editorial e Storage

Entregáveis:

- migrations iniciais versionadas;
- `reflection_sessions`;
- `daily_sources`;
- `reflection_comments`;
- buckets privados;
- policies de Storage;
- índices e foreign keys;
- testes de isolamento entre usuários.

Pronto quando: usuário A não consegue ler, alterar ou baixar dados de usuário B, inclusive por URL e chamada direta à API.

### Semana 6 — Painel e entrada da fonte

Entregáveis:

- tela `/inicio`;
- criação de nova sessão;
- título, data, fonte e texto recebido;
- salvamento de rascunho;
- retomada da sessão;
- upload opcional de PDF, DOCX, TXT e Markdown;
- extração de texto no servidor.

Pronto quando: a fonte pode ser criada, editada antes da aprovação e recuperada após fechar e reabrir o navegador.

### Semana 7 — Comentário e transcrição

Entregáveis:

- comentário escrito;
- gravação no navegador;
- reprodução e regravação;
- upload do áudio original;
- transcrição com OpenAI;
- transcrição bruta separada da edição humana;
- fallback manual quando a transcrição falhar.

Pronto quando: o áudio original e a transcrição permanecem preservados mesmo após edição do texto.

### Semana 8 — Memória histórica

Entregáveis:

- importação da memória;
- armazenamento do arquivo original;
- extração do conteúdo;
- divisão em chunks;
- embeddings;
- busca semântica com `pgvector`;
- tela `/memoria`;
- tela de detalhe da memória.

Pronto quando: dois usuários com conteúdos semelhantes não conseguem recuperar os chunks um do outro.

### Semana 9 — Perfil Autoral

Entregáveis:

- tela `/perfil-autoral`;
- seleção das reflexões-base;
- geração assistida do perfil;
- edição manual;
- versões do perfil;
- ativação explícita;
- arquivamento;
- validação de campos estruturados.

Pronto quando: somente o perfil ativo do usuário é usado pelo Motor Reflexivo e toda versão anterior permanece consultável.

### Semana 10 — Motor Reflexivo

Entregáveis:

- Edge Function `generate-reflection`;
- análise da fonte;
- análise do comentário;
- recuperação semântica;
- aplicação do Perfil Autoral;
- geração JSON estruturada;
- validação da resposta;
- versões independentes;
- registro das referências usadas;
- jobs idempotentes.

Pronto quando: a geração usa fonte, comentário, perfil e memória correta, sem misturar dados de outro usuário.

### Semana 11 — Revisão e aprovação

Entregáveis:

- tela de revisão;
- seleção entre versões;
- edição humana;
- histórico de edição;
- RPC transacional de aprovação;
- máquina de estados;
- imutabilidade pós-aprovação;
- testes de concorrência.

Pronto quando: duas aprovações simultâneas produzem uma única aprovação canônica e uma sessão aprovada não pode ser reaberta por uma chamada antiga.

### Semana 12 — ElevenLabs e narração

Entregáveis:

- armazenamento seguro da credencial;
- seleção de voz;
- listagem de vozes;
- Edge Function `generate-audio`;
- job de narração;
- Storage privado;
- player;
- download;
- retry de falhas transitórias.

Pronto quando: somente texto aprovado pode ser narrado e a falha da ElevenLabs não altera a aprovação textual.

### Semana 13 — Histórico e experiência completa

Entregáveis:

- histórico cronológico;
- detalhe completo da reflexão;
- fonte, comentário, transcrição, gerações, edições e aprovação;
- áudio e download;
- estados de processamento;
- experiência mobile;
- acessibilidade básica.

Pronto quando: o usuário consegue acompanhar toda a origem e evolução de uma reflexão aprovada.

### Semana 14 — PDF e imagem

Entregáveis:

- geração de PDF;
- geração opcional de imagem;
- retries;
- jobs independentes;
- URLs assinadas;
- falhas isoladas da aprovação;
- limpeza de arquivos temporários.

Pronto quando: uma falha de imagem ou PDF não impede a leitura, aprovação ou narração do texto.

### Semana 15 — Vídeo de cenas

Entregáveis:

- storyboard;
- cenas com timestamps;
- uma imagem por cena;
- narração sincronizada;
- player de slideshow;
- retomada por cena;
- update atômico da cena;
- limite de custo.

Pronto quando: duas cenas processadas simultaneamente não sobrescrevem uma à outra e o vídeo pode continuar após uma falha parcial.

### Semana 16 — Homologação e produção

Entregáveis:

- testes unitários completos;
- testes SQL;
- testes E2E;
- teste de segurança;
- teste de quotas;
- revisão de logs;
- verificação de backups;
- checklist de produção;
- deploy aprovado na Vercel;
- documentação operacional.

Pronto quando: o fluxo completo passa em ambiente de desenvolvimento, o Preview é aprovado e a produção recebe somente o artefato validado.

---

## 18. Checklist de execução por lote

Para cada lote, executar sempre:

1. escrever ou atualizar o requisito;
2. definir as tabelas e policies envolvidas;
3. definir o contrato de entrada e saída;
4. implementar o backend;
5. implementar a interface;
6. adicionar testes de sucesso;
7. adicionar testes de falha e autorização;
8. executar lint, typecheck, testes e build;
9. testar no Preview da Vercel;
10. revisar logs e custos;
11. registrar decisões e pendências;
12. somente então iniciar o próximo lote.

Nenhuma fase deve avançar apenas porque a tela visualmente parece funcionar. O banco, as permissões, os erros e os retries precisam ser validados junto com a interface.

---

## 19. Ordem oficial de execução

### Lote 1 — Fundação

- novo repositório;
- Next.js;
- Vercel;
- Supabase desenvolvimento;
- documentação;
- CI;
- login inicial.

### Lote 2 — Segurança e identidade

- Auth completo;
- perfis;
- middleware;
- RLS;
- policies;
- Storage;
- testes de isolamento.

### Lote 3 — Sessão editorial

- painel;
- fonte;
- comentário escrito;
- estados;
- salvamento de rascunho;
- revisão básica.

### Lote 4 — Memória

- importação;
- extração;
- chunks;
- embeddings;
- busca semântica;
- tela de memória.

### Lote 5 — Perfil e geração

- Perfil Autoral;
- geração estruturada;
- versões;
- edição;
- referências;
- aprovação atômica.

### Lote 6 — Voz

- gravação;
- transcrição;
- ElevenLabs;
- player;
- download;
- retry e jobs.

### Lote 7 — Mídia adicional

- PDF;
- imagem;
- vídeo de cenas;
- processamento paralelo controlado.

### Lote 8 — Operação

- quotas;
- logs;
- Sentry, se aprovado;
- limpeza de órfãos;
- backups;
- documentação de recuperação;
- auditoria final.

---

## 20. Critério de conclusão do MVP

O MVP só será considerado concluído quando um usuário conseguir:

1. criar uma conta;
2. confirmar o email;
3. entrar;
4. recuperar a senha;
5. criar uma sessão;
6. cadastrar uma fonte;
7. escrever um comentário;
8. gerar uma reflexão usando memória;
9. revisar e editar;
10. aprovar uma versão;
11. consultar o histórico;
12. repetir uma operação sem duplicar registros ou custos;
13. sair e entrar novamente sem perder isolamento;
14. usar o sistema no desktop e no celular.

A narração será o primeiro recurso pós-MVP, sem bloquear a aprovação textual.

---

## 21. Primeiro pedido para a nova janela do VS Code

Usar este contexto inicial com o agente:

> Estamos construindo do zero o aplicativo Memória Reflexiva. Use Next.js, TypeScript, Tailwind, Supabase e Vercel. Comece lendo `docs/PLANO_CONSTRUCAO_NOVO_APLICATIVO.md`, crie a estrutura inicial, configure o ambiente local e implemente apenas a fundação do Lote 1. Não crie dados de produção, não use secrets no frontend, não instale dependências sem justificar e não avance para o próximo lote sem validar lint, typecheck, testes e build.

O primeiro objetivo é publicar uma página inicial protegida por Supabase Auth em um Preview da Vercel.

---

## 22. Regra de trabalho

Cada lote deverá seguir este ciclo:

```text
ler o plano
  -> implementar uma pequena parte
  -> testar localmente
  -> revisar segurança
  -> abrir Preview na Vercel
  -> validar comportamento
  -> registrar decisão
  -> avançar
```

O objetivo é construir um aplicativo compreensível, reproduzível e evolutivo, mantendo a autoria humana protegida em cada etapa.
