# Personal Finance App — Controle Financeiro Pessoal

Front-end em Next.js (App Router) + TypeScript + Tailwind para o backend Spring Boot em [`../personal_finance_app`](../personal_finance_app). Landing page pública, autenticação com access/refresh token e um painel para controlar saldo, receitas, despesas e categorias.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Configuração

O backend não tem CORS configurado, então o browser nunca pode chamá-lo diretamente de outra origem. Para contornar isso sem tocar no backend, `next.config.ts` reescreve `/backend/*` para a API real — toda chamada do browser fica same-origin.

Copie `.env.example` para `.env.local` e ajuste se necessário:

```
BACKEND_API_URL=http://api-personal-finance.fabriciolongobuccodev.com.br
```

## Arquitetura

Camadas inspiradas em Clean Architecture, com um container de injeção de dependência manual (`src/infrastructure/container.ts`):

- `src/domain` — entidades e contratos de repositório (sem dependência de framework).
- `src/application` — casos de uso (ex.: `AuthService`, que orquestra login/registro e busca do perfil).
- `src/infrastructure` — implementação HTTP dos repositórios, cliente HTTP com refresh automático de token, storage de sessão.
- `src/presentation` — providers, hooks (`@tanstack/react-query`), componentes de UI e as páginas em `src/app`.

## Autenticação

O access token dura 15 min e o refresh token 7 dias (configurado no backend). O `ApiClient` (`src/infrastructure/http/api-client.ts`) anexa o Bearer token em toda chamada autenticada e, ao receber um 401, tenta renovar via `/auth/refresh` uma única vez (com deduplicação de chamadas concorrentes) antes de encerrar a sessão.

Para testar rapidamente como ADMIN (permite criar/excluir categorias), use as credenciais padrão do backend definidas em `application.yaml` (`APP_ADMIN_EMAIL`/`APP_ADMIN_PASSWORD`), caso não tenham sido sobrescritas no servidor.
