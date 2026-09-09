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
  token. That's why `completeSession` (`src/services/auth.ts`)
  always makes a follow-up `GET /api/users?email=` right after login/register to get the full
  profile (id, balance, settledBalance, etc.) — using the fresh token explicitly via `apiClient`'s
  `accessToken` option, since no session is persisted yet to read it from.
- **Register never logs you in** — `POST /auth/register` only creates the user. `authService.register`
  calls `login` right after with the same credentials. Also: register/`POST /api/users` can never
  create an ADMIN (the DTO has no role field) — admin is bootstrap-only (`app.admin.*` in the
  backend's `application.yaml`, default `admin123@personalfinance.local` / `admin123` unless
  overridden by env vars on the server). Bootstrap also seeds the admin's default categories.
- **Access token: 15 min. Refresh token: 7 days.** Refresh (`POST /auth/refresh`) returns the same
  refresh token back unrotated, plus a new access token.
- **`/api/**` requires authentication — and an unauthenticated/expired request returns 403, NOT
  401.** The backend's `SecurityConfig` has no `httpBasic`/`formLogin`/custom entry point, so Spring
  Security 6 answers with `403` whenever the bearer token is expired, invalid, or missing (the JWT
  filter simply skips auth). This is why `apiClient` (`src/lib/api-client.ts`)
  triggers its refresh-and-retry dance on **both 401 and 403** for token-bearing `/api/**` calls.
  Only `/auth/**` is public (login/register/refresh → their own 401 is a plain bad-credentials
  failure). Don't "fix" 403 into 401 backend-side — the frontend already handles both.
- **Permissions**: users can only read/delete their own user, transactions and categories unless
  they're ADMIN (`AccessGuard.requireOwnerOrAdmin`). Transaction create/delete/settle and category
  create/rename/delete are **owner-only, no ADMIN override**. The app only ever calls endpoints for
  the signed-in user's own data, so a 403 from the app itself means the token was rejected.
- **No "list all users" endpoint exists.** Only `GET /api/users?email=` and `GET /api/users/{id}`.
  There is intentionally no admin "user management" page in this app for that reason.
- **There is no user *update* endpoint** — `UserController` has POST (ADMIN-only), GET by id,
  GET by email and DELETE, nothing else. So the profile page is read-only by design: don't build an
  edit form until the backend grows one. If it ever does, keep e-mail out of the payload — it is the
  JWT subject, so changing it would invalidate the caller's own token mid-request.
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
  `src/lib/formatters.ts`. Without this, a transaction created after ~21:00 in
  America/Sao_Paulo lands "tomorrow" server-side and falls outside the current-month filter, leaving
  the dashboard month summary at R$ 0. Query params `start`/`end` on transaction listing are naive
  `LocalDateTime` strings. (Do NOT switch the frontend back to sending local wall-clock time — only
  `startOfMonth`/`toDateInputValue`/date inputs stay local-calendar.)

## Why there's a same-origin proxy (`next.config.ts`)

The backend has **no CORS configuration at all** (verified: no `CorsConfig`/`@CrossOrigin` in the
codebase, and a manual `OPTIONS` preflight against the deployed server confirmed no
`Access-Control-Allow-Origin` header). A browser calling it cross-origin directly would be blocked.
Rather than touching the Java backend, `next.config.ts` rewrites `/backend/:path*` to
`process.env.BACKEND_API_URL`, and `apiClient` (`src/lib/api-client.ts`) only ever
calls the relative `/backend` path. This means every request is same-origin from the browser's POV,
in both dev and prod — but it also means this app must run as a Node server (`next start` / `next dev`),
**not** as a static export, since rewrites need the Next server.

## Architecture (flat and feature-oriented — one folder per kind of thing)

```
src/types/         all backend entities + input/filter shapes, in a single index.ts (`@/types`)
src/lib/           api-client.ts  — fetch wrapper: bearer header, 401/403 → refresh → retry,
                                    plus the ApiError / NetworkError classes
                   session.ts     — localStorage session store (tokens + profile) and
                                    `sessionEvents`, a window CustomEvent so api-client can tell
                                    AuthProvider "session expired" without importing React
                   analytics.ts   — month helpers (MonthRef/monthFilters/monthLabel/...),
                                    `summarize`, and the chart series builders
                   formatters.ts  — currency/date, LocalDateTime helpers, PAYMENT_METHOD_LABELS
                   cn.ts, validation.ts (all zod schemas)
src/services/      auth.ts, users.ts, categories.ts, transactions.ts — one module per backend
                   resource, each a plain object of functions built on `apiClient`. Hooks import
                   these directly; there is no container / DI layer any more.
src/hooks/         use-user.ts, use-categories.ts, use-transactions.ts — react-query wrappers
src/providers/     AuthProvider (session/status/login/register/logout),
                   QueryProvider (@tanstack/react-query), ToastProvider (custom, no lib)
src/components/
  ui/              Button, Card, FormField (Input/Select), Badge, Modal, ConfirmDialog,
                   EmptyState, Spinner, PageHeader — plain Tailwind, no UI library
  layout/          Sidebar (desktop, md:flex), BottomNav (mobile, md:hidden fixed bottom tab bar),
                   MobileTopBar (shows the month balance on mobile), nav-items.ts (single nav source)
  forms/           TransactionFormModal, CategoryFormModal — react-hook-form + zod
  charts/          MonthlyBarChart, CategoryPieChart — hand-rolled SVG, no chart library
  transactions/    TransactionRow
  brand/           Logo.tsx — inline SVG mark, no image asset needed
```

`authService.register` is the one piece of orchestration (register → login → fetch profile);
everything else is a thin call through `apiClient`.

Routing (`src/app`):
- `page.tsx` — public landing page (not gated, reads `useAuth().status` only to swap CTA labels)
- `(auth)/login`, `(auth)/cadastro` — `(auth)/layout.tsx` redirects to `/dashboard` if already
  authenticated
- `(app)/dashboard`, `(app)/transacoes`, `(app)/historico`, `(app)/categorias`, `(app)/perfil` —
  `(app)/layout.tsx` redirects to `/login` if not authenticated, renders Sidebar + BottomNav.
  `/historico` browses previous months (month stepper + quick chips, `monthFilters` from
  `lib/analytics.ts`); the dashboard always shows the current month.

## Design system / brand

- Colors in `src/app/globals.css`: `--color-brand-*` is the exact red ramp from
  `Soler-admin-front/src/app/globals.css` (kept identical on purpose, per the user's request to base
  the new brand on the template's colors). Added `--color-money-*` (emerald) as the semantic
  "income / positive" accent — expenses intentionally reuse brand red (red=spending is an established
  convention and ties the logo color into the app's own data semantics).
- Logo ("Grana"): `src/components/brand/Logo.tsx` + static `public/logo-mark.svg` (used
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


## Rebuilding this app from scratch (step-by-step playbook)

Everything needed to recreate Grana on an empty folder. The sections above are the *reference*
(backend contract, architecture, design tokens); this one is the *order of operations*.

### 0. Prerequisites

- Node 20+ and npm.
- The Java backend reachable: either `../personal_finance_app` running locally (`./mvnw spring-boot:run`,
  port 8080) or the deployed `http://api-personal-finance.fabriciolongobuccodev.com.br`.
- A user account you can log in with. `POST /auth/register` creates one; ADMIN is bootstrap-only.

### 1. Scaffold

```bash
npx create-next-app@latest personal-finance-front \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

App Router, `src/` directory, Tailwind **v4**, alias `@/*` → `./src/*`. Tailwind v4 has no
`tailwind.config.js` — the theme lives in `src/app/globals.css`, and PostCSS only loads
`@tailwindcss/postcss`.

### 2. Dependencies

```bash
npm i @tanstack/react-query react-hook-form @hookform/resolvers zod clsx lucide-react
```

Pinned in `package.json`: Next 16, React 19, react-query 5, react-hook-form 7, **zod 3**, clsx 2,
lucide-react 1. Zod stays on v3 — `src/lib/validation.ts` uses the v3 error API
(`z.coerce.number({ message })`), which v4 renames.

Deliberately **not** installed, and the rebuild should keep it that way:

- no UI kit (Radix/shadcn/MUI) — `src/components/ui/*` is ~40 lines of Tailwind each;
- no chart library — `MonthlyBarChart`/`CategoryPieChart` are hand-rolled SVG (~150 lines each),
  which keeps the bundle small and the colors on the app's own token ramps;
- no date library — `Intl.DateTimeFormat` plus the helpers in `src/lib/formatters.ts`;
- no auth library — JWT in `localStorage` (see the backend contract: no cookies, no CORS).

### 3. Configuration files

1. `.env.local` (copy `.env.example`): `BACKEND_API_URL=<backend origin>`. Server-side only — it is
   read by `next.config.ts`, never shipped to the browser, so no `NEXT_PUBLIC_` prefix.
2. `next.config.ts`: the `/backend/:path*` → `${BACKEND_API_URL}/:path*` rewrite. Non-negotiable —
   see "Why there's a same-origin proxy". The app must run as a Node server; `output: "export"`
   would break every API call.
3. `tsconfig.json`: `strict: true` and `paths: { "@/*": ["./src/*"] }`.

### 4. Design tokens (`src/app/globals.css`)

Three ramps declared as CSS variables on `:root`, then re-exported inside `@theme inline` so Tailwind
generates the utilities (`bg-brand-700`, `text-ink-500`, `text-money-600`, …):

- `--color-brand-*` — deep red, the brand and the "expense" semantic;
- `--color-ink-*` — warm neutral, all text and borders;
- `--color-money-*` — emerald, the "income / positive" semantic.

Plus `--background`/`--foreground` applied to `body`, and a `::selection` in `brand-200`. Skipping the
`@theme inline` re-export is the usual mistake: the variables exist but no Tailwind class does.

### 5. Build order (bottom-up — every step compiles on its own)

1. **`src/types/index.ts`** — mirror the DTOs from `/v3/api-docs`. Nothing imports anything here.
2. **`src/lib/session.ts`** — `sessionStore` (localStorage read/write + token accessors) and
   `sessionEvents` (a window `CustomEvent`). No React, no fetch.
3. **`src/lib/api-client.ts`** — the fetch wrapper plus `ApiError`/`NetworkError`. This is where the
   401/403 → refresh → retry logic and the `ProblemDetail.detail` parsing live. Write it *before* any
   service; everything else is a thin call through it.
4. **`src/services/{users,categories,transactions,auth}.ts`** — in that order (`auth` imports `users`
   for the post-login profile fetch).
5. **`src/lib/{cn,formatters,validation,analytics}.ts`** — pure functions, no React.
6. **`src/providers/*`** then `src/app/layout.tsx`, nesting `QueryProvider > ToastProvider >
   AuthProvider` (Auth is innermost: it calls `router` and needs the toast/query context available).
7. **`src/hooks/*`** — react-query wrappers over the services.
8. **`src/components/ui/*`** → `brand/` → `layout/` (`nav-items.ts` first, it is the single source of
   truth for both `Sidebar` and `BottomNav`) → `forms/` → `charts/` → `transactions/`.
9. **`src/app/**`** — the route groups last.

### 6. Screen inventory (what each route must do)

| Route | Gate | Must have |
| --- | --- | --- |
| `/` | none | Landing: hero, feature cards, CTAs whose labels swap on `useAuth().status` |
| `(auth)/login` | redirects to `/dashboard` if authenticated | RHF+zod form; `?expired=1` shows a "sessão expirada" notice |
| `(auth)/cadastro` | idem | name / email / phone / password + confirm / initialBalance → register → auto-login → `/dashboard` |
| `(app)/dashboard` | redirects to `/login` if anonymous | Saldo do mês (receitas − despesas), receitas/despesas cards, 6-month bar chart, category donut, pending-expenses list, month transactions, new-transaction modal |
| `(app)/transacoes` | idem | Date-range + type filters, full list with settle ("dar baixa") and delete |
| `(app)/historico` | idem | Month stepper (cannot advance past the current month) + 12 quick-jump chips, month summary cards, donut, transaction list |
| `(app)/categorias` | idem | INCOME/EXPENSE tabs, create modal, delete behind `ConfirmDialog` (409 when still referenced) |
| `(app)/perfil` | idem | Profile data (read-only — no update endpoint), logout, delete-account behind `ConfirmDialog` |

`(app)/layout.tsx` renders `Sidebar` (desktop) + `MobileTopBar` + `BottomNav` (mobile) around the page.

### 7. Rules you cannot skip

Each of these was an actual bug, not a preference — details in the sections above.

- **Period params go out as UTC wall clock** (`toServerDateTimeParam` / `startOfDayParam` /
  `endOfDayParam`) and naive responses are parsed as UTC (`parseServerDateTime`). Get this wrong and
  evening transactions fall outside the month window, leaving the dashboard at R$ 0.
- **403 means "token rejected", same as 401** — both must trigger the refresh-and-retry.
- **Invalidate `["user", id]` after every transaction mutation**, otherwise the balance goes stale.
- **`POST /auth/register` does not log you in** — `authService.register` logs in right after.
- `paid` defaults to `true` for INCOME and `false` for EXPENSE; `PATCH .../settle` only accepts EXPENSE.
- A category's `type` is fixed for life — `PUT /api/categories/{id}` renames only.
- The spinner flash on `(auth)`/`(app)` first paint is expected: `AuthProvider` starts in `"loading"`
  until a `useEffect` reads `localStorage`. Don't "fix" it with SSR session reads — there is no cookie.

### 8. Verification (no browser needed)

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Then an end-to-end pass through the proxy with `npm run dev` running — this exercises the same path the
browser takes, CORS included:

```bash
API=http://localhost:3000/backend
EMAIL="smoke$(date +%s)@test.local"

curl -s -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke\",\"email\":\"$EMAIL\",\"phone\":\"11999999999\",\"password\":\"secret123\",\"initialBalance\":1000}"

TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')
AUTH="Authorization: Bearer $TOKEN"

USER_ID=$(curl -s -G "$API/api/users" --data-urlencode "email=$EMAIL" -H "$AUTH" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
CAT_ID=$(curl -s "$API/api/categories?type=EXPENSE" -H "$AUTH" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')   # default categories are seeded

TX_ID=$(curl -s -X POST $API/api/transactions -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"description\":\"Smoke\",\"categoryId\":\"$CAT_ID\",\"amount\":10.5,\"userId\":\"$USER_ID\",\"paymentMethod\":\"PIX\",\"paid\":false}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

curl -s -X PATCH "$API/api/transactions/$TX_ID/settle" -H "$AUTH"      # dar baixa
curl -s -X DELETE "$API/api/transactions/$TX_ID" -H "$AUTH" -o /dev/null -w '%{http_code}\n'
curl -s "$API/api/users/$USER_ID" -H "$AUTH"                          # balance back to 1000
```

Checks worth making by eye afterwards: mobile widths (the bottom nav carries 5 tabs), the
current-month dashboard totals against the `/historico` view of the same month, and that an expired
token really bounces you to `/login?expired=1`.

Note on the shell: in zsh never name a loop variable `path` — it aliases `$PATH` and every later
command in that shell dies with exit 127.
