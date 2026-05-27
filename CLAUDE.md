# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm start` (alias for `ng serve`) → http://localhost:4200
- **Build:** `ng build` → outputs to `dist/skyteam_app` (production by default, with 4MB warn / 6MB error budgets)
- **Dev build watch:** `npm run watch`
- **Tests:** `ng test` (Karma + Jasmine, Chrome launcher)
- **Single test file:** `ng test --include='src/app/**/<file>.spec.ts'`
- **Deploy (Firebase Hosting):** `ng build && firebase deploy` (hosting serves `dist/skyteam_app`; `src/_redirects` rewrites all paths to `/index.html` for SPA routing). Backend was migrated off Firebase to Supabase, but the static SPA is still hosted on Firebase Hosting — these are independent.

Angular CLI 21 / TypeScript 5.9 / Node 20.19+ or 22.12+ or 24.

## Architecture

Angular 21 SPA, fully standalone (no NgModules), state via Signals, backed by **Supabase** (Postgres + Auth) for managing *clientes* (clients with package/start-date) and *líderes/patrocinadores* (sponsors). UI strings and domain identifiers are in **Spanish** — keep new code consistent with that vocabulary (`cliente`, `lider`, `paquete`, `fechaInicio`).

The project went through two major migrations in 2026: Firebase → Supabase (data/auth), then Angular 16 → 21 with full standalone + signals + Tailwind UI.

### Routing

All routing lives in plain `Routes` files (no `RouterModule`):

- `src/app/app.routes.ts` — root routes, bootstrapped via `provideRouter(APP_ROUTES)` in `main.ts`.
- `src/app/auth/auth.routes.ts` — `/auth/login`, `/auth/clientes` (a legacy `TablePageComponent` — read-only client list; verify before extending).
- `src/app/dashboard/dashboard.routes.ts` — `/dashboard/opciones`, `/dashboard/clientes`, `/dashboard/patrocinadores`. All render inside `DashboardLayoutComponent` (sidebar + content).

Auth: `/auth` is wrapped by `LoginGuard` (redirects authenticated users away). `/dashboard` is wrapped by `AuthGuard`.

### Supabase client

A single `SupabaseService` (`src/app/services/supabase.service.ts`) holds the app-wide `SupabaseClient`. Every other service injects this and uses `supabase.client.auth` / `supabase.client.from(...)`. Do not call `createClient` anywhere else.

The client is constructed with a **no-op `lock`** function — this suppresses noisy `NavigatorLockAcquireTimeoutError` warnings during HMR. Side effect: cross-tab token refresh isn't coordinated. Fine for this single-tab CRUD app; revisit if multi-tab session sync ever matters.

Environment shape (`src/app/environments/environment.ts`):
```ts
{ supabase: { url, anonKey } }
```
`anonKey` here is the Supabase **publishable** key (the new name for the anon key) — safe to ship in the frontend bundle. The secret/service_role key must **never** leave `migration/.env`.

### Auth flow

`AuthService` (`src/app/auth/services/auth.service.ts`):
- Owns a `signal<User | null | undefined>(undefined)` as the source of truth. Exposes `user` (computed, never `undefined`), `isLoggedIn` (computed), and `user$` (Observable derived via `toObservable()` for the guards that still use rxjs `take(1)`).
- The initial `undefined` state is intentional: guards filter it out so an authenticated user on hard refresh isn't bounced to login before Supabase restores the session.
- `logInWithEmail` calls `signInWithPassword`, navigates to `/dashboard` on success. On failure it runs `error.message` through a small Spanish translation table (e.g. *Invalid login credentials* → *Email o contraseña incorrectos*) and shows it via SweetAlert2 with the custom CSS classes `bg-negro`, `texto-blanco`, `confirm-button-class` (these are restyled in `styles.css` to match the dark theme).
- `logOut` calls `signOut` and navigates to `/auth/login` (use the full path — `/login` alone does not exist).
- There is no signup flow. Users are created manually in the Supabase Auth dashboard.

### Data services (Signals)

`ClientService` and `LiderService` (`src/app/dashboard/services/`) follow the same pattern:

- Private `_clients = signal<Client[]>([])` / `_lideres = signal<Lider[]>([])` is the source of truth. Public `clients` / `lideres` are exposed as `asReadonly()` signals.
- CRUD methods (`add*`, `update*`, `delete*`) are **async/Promise-returning** — callers use `.then().catch()`. Each mutation calls a private `refresh()` that re-fetches and updates the signal — that's why consumers don't need to manually trigger reloads after dialog close.
- Consumer components read the service signals and (where they need a different shape, e.g. enriched with `liderNombre`) wrap them in `computed()`. Sync into non-reactive APIs (form fields, etc.) is done with `effect()`.
- New row IDs are generated with `crypto.randomUUID()` in the service before insert; the DB has `id text PRIMARY KEY` with no default. IDs migrated from Firestore were preserved verbatim.

**Column naming mismatch:** Postgres uses snake_case (`fecha_inicio`), the `Client` interface keeps camelCase (`fechaInicio`). `ClientService` has explicit `toClient` / `toRow` mappers — when adding new columns to `clientes`, update **both** mappers, not just the interface. `LiderService` doesn't need mapping because all lider columns are single-word.

### Domain model

`Client` interface (`src/app/interfaces/client.interface.ts`) carries `paquete` (id referencing `PAQUETES`) and `fechaInicio: string | Date | null` — the union is intentional: forms produce `Date` (native `<input type="date">`), DB returns ISO `string`. The service handles both.

The package catalog lives in `dashboard/shared/constants/paquetes.constants.ts` as a static array sorted with Spanish locale; entries mix months (e.g. `'12 MESES'`) and days (`'15 DÍAS'`). When adding new packages, update that array — table expiry calculations in `clientes-table.component.ts` (`getPaqueteDuration`) **parse the `nombre` string**.

**`paquete` ID type quirk:** `PAQUETES[].id` is `number`, but the DB column is `text` and stores it as a string (`"1"`). All lookups use `String(p.id) === String(paqueteId)` to bridge the gap. Do not revert to `===` — it silently breaks the Paquete/estado/fechaVencimiento columns.

### Database schema

Lives in `migration/schema.sql`. Two tables, both with `id text PRIMARY KEY` (to preserve Firestore-era UUIDs and any client-generated UUIDs):

- `lideres (id, nombre, apellido, created_at)`
- `clientes (id, nombre, telefono, lider → lideres.id ON DELETE SET NULL, paquete, fecha_inicio, created_at)`

RLS is **enabled** on both with a single policy: `authenticated` role has full access (matches the old Firebase behavior). The anon role gets nothing — unauthenticated reads will return empty. The dashboard guard handles UX gating; RLS is the actual access boundary.

### Migration tooling

The `migration/` folder is a separate Node project with its own `package.json` — used to dump Firestore data and load it into Supabase. Both scripts (`export-firestore.mjs`, `import-supabase.mjs`) read from `migration/exports/firestore-<timestamp>/`. The folder's `.gitignore` keeps `service-account.json`, `.env`, `users.json`, and `exports/` out of git. If touching anything here, never commit credentials.

### UI stack

- **Tailwind CSS v4** via PostCSS (`postcss.config.js` + `@tailwindcss/postcss`). Design tokens live in `src/styles.css` inside `@theme { ... }` as OKLCH colors (`--color-background`, `--color-card`, `--color-border`, `--color-primary`, `--color-destructive`, `--color-success`, etc.). Reference them in templates as `bg-(--color-card)`, `text-(--color-foreground)`, etc.
- **Dark theme only.** `<html class="dark">` is set in `index.html`; there is no light theme toggle.
- **No component library.** Buttons, inputs, selects, tables are plain HTML with Tailwind classes. **Dialogs use `@angular/cdk/dialog`** (CDK Dialog) — inject `Dialog`, call `.open(Component, { data })`, return value via `DialogRef.close(value)`. Each dialog component renders its own frame (`w-full max-w-md rounded-lg border bg-(--color-card)...`); the CDK only provides overlay + focus trap + a11y.
- **Tables are hand-rolled** with sort/filter/paginate computed from signals (`filter`, `sortColumn`, `sortDir`, `page`, `pageSize`). See `clientes-table.component.ts` for the pattern.
- **Icons:** `@lucide/angular` v1.x. Use the dynamic icon pattern: import the icon constant (`LucideUsers`) and the `LucideDynamicIcon` component, then `<svg lucideIcon [lucideIcon]="Users" class="size-4"></svg>`. Do not try the old `<lucide-icon [img]="...">` pattern — that's pre-v1.
- **Feedback** uses **SweetAlert2** (`sweetalert2`), not custom toasts/banners, for error and confirmation messaging — match this pattern for new flows.
- Supabase errors are flat (`err.message`, not `err.error.message`). The Firebase-style `err.error.message` pattern that lingered in some catch handlers has been fixed — don't reintroduce it.

### TypeScript config note

`tsconfig.app.json` declares `"types": ["node"]` and `@types/node` is a devDependency. This is **only** to satisfy `NodeJS.Timeout` / `Buffer` references in `@supabase/storage-js` and `@supabase/phoenix` type definitions — it does not pull Node polyfills into the browser bundle. Don't remove it.

## Deployment

Configured for **Firebase Hosting** (`firebase.json` points `public` at `dist/skyteam_app`). The `src/_redirects` file is included for compatibility with hosts like Netlify; on Firebase the SPA fallback is handled by hosting rewrites if added separately. Note that despite using Firebase Hosting for the static bundle, the **runtime backend is Supabase** — there is no Firebase project for data/auth anymore.
