# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm start` (alias for `ng serve`) → http://localhost:4200
- **Build:** `ng build` → outputs to `dist/skyteam_app` (production by default, with 4MB warn / 6MB error budgets)
- **Dev build watch:** `npm run watch`
- **Tests:** `ng test` (Karma + Jasmine, Chrome launcher)
- **Single test file:** `ng test --include='src/app/**/<file>.spec.ts'`
- **Deploy (Firebase Hosting):** `ng build && firebase deploy` (hosting serves `dist/skyteam_app`; `src/_redirects` rewrites all paths to `/index.html` for SPA routing). Backend was migrated off Firebase to Supabase, but the static SPA is still hosted on Firebase Hosting — these are independent.

Angular CLI 16.2 / TypeScript 5.1 / Node-managed via `package.json`. No lint script is configured.

## Architecture

Angular 16 SPA backed by **Supabase** (Postgres + Auth) for managing *clientes* (clients with package/start-date) and *líderes/patrocinadores* (sponsors). UI strings and domain identifiers are in **Spanish** — keep new code consistent with that vocabulary (`cliente`, `lider`, `paquete`, `fechaInicio`).

The project was migrated from Firebase (Auth + Firestore) to Supabase in 2026. The data layer is now relational with foreign keys; the auth flow uses Supabase Auth via `@supabase/supabase-js`.

### Module layout & routing

Two lazy-loaded feature modules wired in `app-routing.module.ts`:

- **`/auth`** (`AuthModule`) — public. Wrapped by `LoginGuard` so authenticated users are redirected away. Children: `login`, `clientes` (a `TablePageComponent` that appears legacy — duplicates dashboard functionality; verify before extending it).
- **`/dashboard`** (`DashboardModule`) — protected by `AuthGuard`. Children: `opciones`, `clientes`, `patrocinadores`. All render inside `DashboardLayoutComponent` (shared shell + navbar).

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
- Subscribes once to `supabase.client.auth.onAuthStateChange` and pushes the user into a `BehaviorSubject<User | null | undefined>`. The public `user$` filters out the initial `undefined` so guards using `take(1)` always wait for a real value (otherwise an authenticated user on a hard refresh could be redirected to login before the session is restored).
- `logInWithEmail` calls `signInWithPassword`, navigates to `/dashboard` on success. On failure it runs `error.message` through a small Spanish translation table (e.g. *Invalid login credentials* → *Email o contraseña incorrectos*) and shows it via SweetAlert2 with the custom CSS classes `bg-negro`, `texto-blanco`, `confirm-button-class`.
- `logOut` calls `signOut` and navigates to `/auth/login` (use the full path — `/login` alone does not exist).
- There is no signup flow. Users are created manually in the Supabase Auth dashboard.

### Data services

`ClientService` and `LiderService` (`src/app/dashboard/services/`) follow the same pattern:

- A private `BehaviorSubject<T[]>` is the source of truth. `getClients()` / `getLideres()` return it as an `Observable`.
- CRUD methods (`add*`, `update*`, `delete*`) are **async/Promise-returning** — callers use `.then().catch()`. Each mutation calls a private `refresh()` that re-fetches and emits — that's why subscribers in components auto-update without any manual reload after dialog close.
- New row IDs are generated with `crypto.randomUUID()` in the service before insert; the DB has `id text PRIMARY KEY` with no default. IDs migrated from Firestore were preserved verbatim.

**Column naming mismatch:** Postgres uses snake_case (`fecha_inicio`), the `Client` interface keeps camelCase (`fechaInicio`). `ClientService` has explicit `toClient` / `toRow` mappers — when adding new columns to `clientes`, update **both** mappers, not just the interface. `LiderService` doesn't need mapping because all lider columns are single-word.

### Domain model

`Client` interface (`src/app/interfaces/client.interface.ts`) carries `paquete` (id referencing `PAQUETES`) and `fechaInicio: string | Date | null` — the union is intentional: forms produce `Date` (mat-datepicker), DB returns ISO `string`. The service handles both.

The package catalog lives in `dashboard/shared/constants/paquetes.constants.ts` as a static array sorted with Spanish locale; entries mix months (e.g. `'12 MESES'`) and days (`'15 DÍAS'`). When adding new packages, update that array — table expiry calculations in `clientes-table.component.ts` (`getPaqueteDuration`, `calculateFechaVencimiento`, `isExpired`) **parse the `nombre` string**.

**`paquete` ID type quirk:** `PAQUETES[].id` is `number`, but the DB column is `text` and stores it as a string (`"1"`). All lookups in `clientes-table.component.ts` use `String(p.id) === String(paqueteId)` to bridge the gap. Do not revert to `===` — it silently breaks the Paquete/estado/fechaVencimiento columns.

### Database schema

Lives in `migration/schema.sql`. Two tables, both with `id text PRIMARY KEY` (to preserve Firestore-era UUIDs and any client-generated UUIDs):

- `lideres (id, nombre, apellido, created_at)`
- `clientes (id, nombre, telefono, lider → lideres.id ON DELETE SET NULL, paquete, fecha_inicio, created_at)`

RLS is **enabled** on both with a single policy: `authenticated` role has full access (matches the old Firebase behavior). The anon role gets nothing — unauthenticated reads will return empty. The dashboard guard handles UX gating; RLS is the actual access boundary.

### Migration tooling

The `migration/` folder is a separate Node project with its own `package.json` — used to dump Firestore data and load it into Supabase. Both scripts (`export-firestore.mjs`, `import-supabase.mjs`) read from `migration/exports/firestore-<timestamp>/`. The folder's `.gitignore` keeps `service-account.json`, `.env`, `users.json`, and `exports/` out of git. If touching anything here, never commit credentials.

### UI conventions

- **Angular Material** is re-exported via two separate `MaterialModule` files (`auth/modules/material`, `dashboard/modules/material`). When a component needs a new Material primitive (e.g. `MatDialogModule`), add it to the relevant feature's `MaterialModule` rather than importing it directly.
- **Dialogs / modals** for delete and add-edit flows live as components under each page's `components/` folder (e.g. `clientes-page/components/add-edit-clientes`, `components/delete`) and are declared in `DashboardModule`.
- **User feedback** uses **SweetAlert2** (`sweetalert2`), not Material snackbars/dialogs, for error and confirmation messaging — match this pattern for new flows.
- Supabase errors are flat (`err.message`, not `err.error.message`). The Firebase-style `err.error.message` pattern that lingered in some catch handlers has been fixed — don't reintroduce it.

### TypeScript config note

`tsconfig.app.json` declares `"types": ["node"]` and `@types/node` is a devDependency. This is **only** to satisfy `NodeJS.Timeout` / `Buffer` references in `@supabase/storage-js` and `@supabase/phoenix` type definitions — it does not pull Node polyfills into the browser bundle. Don't remove it.

## Deployment

Configured for **Firebase Hosting** (`firebase.json` points `public` at `dist/skyteam_app`). The `src/_redirects` file is included for compatibility with hosts like Netlify; on Firebase the SPA fallback is handled by hosting rewrites if added separately. Note that despite using Firebase Hosting for the static bundle, the **runtime backend is Supabase** — there is no Firebase project for data/auth anymore.
