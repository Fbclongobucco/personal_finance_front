<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Grana — Personal Finance Front-end

Front-end for the Java/Spring Boot backend at `../personal_finance_app` (deployed at
`http://api-personal-finance.fabriciolongobuccodev.com.br`, Swagger at `/swagger-ui/index.html`).
Public landing page + login/cadastro, then a protected app with dashboard, transactions,
categories and profile. Built to mirror the layered architecture used in `../Soler-admin-front`.

## Backend contract (read this before touching auth or API calls)

Source of truth: `../personal_finance_app/src/main/java/.../infra/rest/**` and `/v3/api-docs`.
Re-fetch `curl http://api-personal-finance.fabriciolongobuccodev.com.br/v3/api-docs` if the backend
changes — don't assume this summary stays accurate forever.

- **Auth model**: JWT, no cookies. `POST /auth/login` returns `{accessToken, refreshToken}`; `POST /auth/register`
  returns the **created user** (never tokens — it does not log you in). The JWT subject is the user's
  *email*, claims are `role` and `type` (`access`|`refresh`); there is no user id or name in the
  token. That's why `AuthService.completeSession` (`src/application/use-cases/auth/auth-service.ts`)
  always makes a follow-up `GET /api/users?email=` right after login/register to get the full
  profile (id, balance, settledBalance, etc.) — using the fresh token explicitly via `apiClient`'s
  `accessToken` option, since no session is persisted yet to read it from.
- **Register never logs you in** — `POST /auth/register` only creates the user. `AuthService.register`
  calls `login` right after with the same credentials. Also: register/`POST /api/users` can never
  create an ADMIN (the DTO has no role field) — admin is bootstrap-only (`app.admin.*` in the
  backend's `application.yaml`, default `admin123@personalfinance.local` / `admin123` unless
  overridden by env vars on the server). Bootstrap also seeds the admin's default categories.
- **Access token: 15 min. Refresh token: 7 days.** Refresh (`POST /auth/refresh`) returns the same
  refresh token back unrotated, plus a new access token.
- **`/api/**` requires authentication — and an unauthenticated/expired request returns 403, NOT
  401.** The backend's `SecurityConfig` has no `httpBasic`/`formLogin`/custom entry point, so Spring
  Security 6 answers with `403` whenever the bearer token is expired, invalid, or missing (the JWT
  filter simply skips auth). This is why `apiClient` (`src/infrastructure/http/api-client.ts`)
  triggers its refresh-and-retry dance on **both 401 and 403** for token-bearing `/api/**` calls.
  Only `/auth/**` is public (login/register/refresh → their own 401 is a plain bad-credentials
  failure). Don't "fix" 403 into 401 backend-side — the frontend already handles both.
- **Permissions**: users can only read/delete their own user, transactions and categories unless
  they're ADMIN (`AccessGuard.requireOwnerOrAdmin`). Transaction create/delete/settle and category
  create/rename/delete are **owner-only, no ADMIN override**. The app only ever calls endpoints for
  the signed-in user's own data, so a 403 from the app itself means the token was rejected.
- **No "list all users" endpoint exists.** Only `GET /api/users?email=` and `GET /api/users/{id}`.
  There is intentionally no admin "user management" page in this app for that reason.
- **Categories are owned by the user** (`userId` on every `CategoryResponseDto`). Every new account
  (and the bootstrap ADMIN) is seeded with a default set (Salário, Alimentação, Moradia, ...), so
  the "Nova categoria" action is for extra ones. `GET /api/categories` without `userId` returns the
  caller's own categories (repeatable `userId` + `allUsers=true` are ADMIN-only views); list can be
  narrowed by `type` and a case-insensitive `name` fragment. `POST /api/categories` takes
  `{name, type}` and creates the category for the caller. `PUT /api/categories/{id}` renames it
  (type is fixed for life). `DELETE /api/categories/{id}` returns 409 if the category is still
  referenced by transactions. Get/list only ever show the caller's own categories unless ADMIN.
- **Transactions**: `paid` defaults to `true` for INCOME (always considered settled) and `false` for
  EXPENSE. The `category` in a `TransactionResponseDto` is the user's own nested
  `CategoryResponseDto` (with `userId`). `PATCH /api/transactions/{id}/settle` ("dar baixa") only
  works on EXPENSE transactions. Deleting/creating a transaction changes the user's `balance`
  server-side — always invalidate the `["user", id]` query key after transaction mutations (see
  `use-transactions.ts`). `PaymentMethod` enum: `CASH | CREDIT_CARD | DEBIT_CARD | INVOICE | TICKET | PIX`.
- **Errors**: business/domain errors come back as Spring `ProblemDetail`
  (`{title, detail, status, instance}`); validation errors from a well-formed request also land
  there via `@RestControllerAdvice`. `apiClient` reads `body.detail` — if you add a new call, don't
  rely on `body.message`. (A truly malformed JSON body returns Spring's default
  `{timestamp,status,error,path}` instead, which `apiClient` still surfaces via `detail ?? fallback`.)
- **Dates**: `createdAt`/`updatedAt` on `User` are `LocalDate` (`"2026-09-07"`, no time). On
  `Category`/`Transaction` they're `LocalDateTime` with no timezone offset — the **deployed server runs
  UTC**, so naive values are UTC wall-clock. The frontend must therefore (a) send period bounds as
  UTC wall-clock via `toServerDateTimeParam`/`startOfDayParam`/`endOfDayParam`, and (b) parse naive
  values as UTC for display/bucketing via `parseServerDateTime` — both in
  `src/presentation/lib/formatters.ts`. Without this, a transaction created after ~21:00 in
  America/Sao_Paulo lands "tomorrow" server-side and falls outside the current-month filter, leaving
  the dashboard month summary at R$ 0. Query params `start`/`end` on transaction listing are naive
  `LocalDateTime` strings. (Do NOT switch the frontend back to sending local wall-clock time — only
  `startOfMonth`/`toDateInputValue`/date inputs stay local-calendar.)

## Why there's a same-origin proxy (`next.config.ts`)

The backend has **no CORS configuration at all** (verified: no `CorsConfig`/`@CrossOrigin` in the
codebase, and a manual `OPTIONS` preflight against the deployed server confirmed no
`Access-Control-Allow-Origin` header). A browser calling it cross-origin directly would be blocked.
Rather than touching the Java backend, `next.config.ts` rewrites `/backend/:path*` to
`process.env.BACKEND_API_URL`, and `apiClient` (`src/infrastructure/http/api-client.ts`) only ever
calls the relative `/backend` path. This means every request is same-origin from the browser's POV,
in both dev and prod — but it also means this app must run as a Node server (`next start` / `next dev`),
**not** as a static export, since rewrites need the Next server.

## Architecture (Clean Architecture-ish, manual DI, mirrors `../Soler-admin-front`)

```
src/domain/            entities + repository interfaces, no framework deps
src/application/       AuthService — the only real "use case" so far, orchestrates auth + profile fetch
src/infrastructure/     http/api-client.ts        — fetch wrapper: bearer header, 401→refresh→retry
                        auth/session-storage.ts   — localStorage-backed session + tokenAccessor
                        auth/session-events.ts    — window CustomEvent so api-client can tell
                                                     AuthProvider "session expired" without importing React
                        repositories/http-*.ts    — one file per domain repo, all built on apiClient
                        container.ts              — composition root; presentation code imports
                                                     ONLY from here, never a repository directly
src/presentation/
  providers/            AuthProvider (session/status/login/register/logout),
                         QueryProvider (@tanstack/react-query), ToastProvider (custom, no lib)
  hooks/                 use-user.ts, use-categories.ts, use-transactions.ts — all react-query,
                         call container.* directly (not repositories)
  components/ui/         Button, Card, FormField (Input/Select), Badge, Modal, ConfirmDialog,
                         EmptyState, Spinner, PageHeader — plain Tailwind, no UI library
  components/layout/     Sidebar (desktop, md:flex), BottomNav (mobile, md:hidden fixed bottom tab
                         bar), MobileTopBar (shows balance on mobile)
  components/forms/      TransactionFormModal, CategoryFormModal — react-hook-form + zod
  components/brand/      Logo.tsx — inline SVG mark, no image asset needed
  lib/                   cn.ts (clsx wrapper), formatters.ts (currency/date, LocalDateTime helpers,
                         PAYMENT_METHOD_LABELS), validation.ts (all zod schemas)
```

Routing (`src/app`):
- `page.tsx` — public landing page (not gated, reads `useAuth().status` only to swap CTA labels)
- `(auth)/login`, `(auth)/cadastro` — `(auth)/layout.tsx` redirects to `/dashboard` if already
  authenticated
- `(app)/dashboard`, `(app)/transacoes`, `(app)/categorias`, `(app)/perfil` — `(app)/layout.tsx`
  redirects to `/login` if not authenticated, renders Sidebar + BottomNav

## Design system / brand

- Colors in `src/app/globals.css`: `--color-brand-*` is the exact red ramp from
  `Soler-admin-front/src/app/globals.css` (kept identical on purpose, per the user's request to base
  the new brand on the template's colors). Added `--color-money-*` (emerald) as the semantic
  "income / positive" accent — expenses intentionally reuse brand red (red=spending is an established
  convention and ties the logo color into the app's own data semantics).
- Logo ("Grana"): `src/presentation/components/brand/Logo.tsx` + static `public/logo-mark.svg` (used
  as favicon). It's three ascending bars on a rounded brand-red square, finishing in the money-green
  accent (growth motif) — not a raster asset, so it scales cleanly at any size.

## Known limitations / things to check before shipping

- **No browser was available while building this** — verified via `npm run build`, `npm run lint`,
  and curl-based end-to-end testing against the live backend (register → login → create transaction
  → settle → delete, categories list, error shapes) through the `/backend` proxy. All response shapes
  matched the TS types. But nobody has actually looked at the rendered pages — do a visual pass
  (especially mobile widths, and the loading-flash on `(auth)`/`(app)` layouts, which is expected:
  `AuthProvider` starts in a `"loading"` status until a `useEffect` reads `localStorage`, so SSR/first
  paint always shows a spinner even when there's no session to restore).
- Category delete returns 409 if a category is still referenced by transactions — the UI surfaces
  whatever `ProblemDetail.detail` says via the confirm dialog's toast, no special-casing.
- If you add a shell test loop over routes, don't name the loop variable `path` in zsh — it aliases
  `$PATH` and silently breaks every subsequent command in that shell (`command not found`, exit 127).

