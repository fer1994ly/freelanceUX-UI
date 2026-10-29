# Event registration

Self-service registration for workshops and events of a UX/UI studio: public activity list, mobile-first sign-up (name, email, phone, consent), automatic waitlist with a 24-hour confirmation window, QR check-in, PIN-gated admin panel, CSV export and a short post-event survey.

Stack: Vite, React, TypeScript, React Router, Vitest + Testing Library, Playwright. UI copy is in Spanish; code, identifiers and tests are in English.

## Quick start

```bash
npm install
cp .env.example .env     # set VITE_ADMIN_PIN
npm run dev              # http://localhost:5173
```

On first load with empty storage the app seeds three demo activities (one nearly full). The admin panel (`/admin`) has a "Restablecer datos de demostración" button to reset them.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit and integration tests (Vitest, jsdom) |
| `npm run test:e2e` | Playwright against `vite preview` (builds first) |

## Architecture

DDD vertical slices with ports and adapters. Each slice has `domain` (pure TypeScript: no React, no `localStorage`), `application` (use cases and ports), `infrastructure` (adapters) and `ui`.

```
src/
  shared/        Clock, IdGenerator, Result, errors, LockManager, storage helpers, shared UI
  modules/
    activities/    Activity aggregate, create / list upcoming / duplicate
    registrations/ RegistrationBook aggregate, waitlist, offers, Notifier + outbox
    attendance/    single-use QR check-in, manual toggle
    surveys/       one answer per registration, results
    reporting/     CSV export
  app/           composition root (container.ts), routes, seed, admin panel
```

Ports and adapters:

```
UI (React) --> application services --> domain (pure)
                      |
                      +--> ports: ActivityRepository, RegistrationBookRepository,
                                  SurveyRepository, Notifier, LockManager, Clock, IdGenerator
                                      ^
                      adapters:       |
                        LocalStorage*Repository, LocalStorageOutbox,
                        BrowserLockManager (Web Locks API + in-memory fallback),
                        SystemClock, CryptoIdGenerator
```

`src/app/container.ts` is the only place that binds ports to adapters.

### Concurrency

The `RegistrationBook` (all registrations of one activity) is the unit of consistency. Every mutation:

1. takes an exclusive lock per activity through `LockManager` (`navigator.locks.request`, shared across tabs of the same browser; in-memory fallback otherwise);
2. reads the book, resolves expired offers, applies the domain rule;
3. saves with an optimistic `version` check (`ConcurrencyError` on mismatch, retried once on a fresh read).

Result: two simultaneous registrations for the last seat produce exactly one confirmed and one waitlisted registration. This is covered by unit tests (real concurrent promises, with and without the lock) and by Playwright (two pages in one browser context).

### Waitlist and offers

When a confirmed seat is freed, the first waitlisted person becomes `offered` with `offerExpiresAt = now + 24h` and a `seat-offered` message is written to the outbox. They confirm at `/offer/:token`. Expired offers are resolved lazily on any read or write of that activity and cascade to the next person; time comes from the `Clock` port, so tests control it.

### Notifications

No email is sent. The `Notifier` port is implemented by `LocalStorageOutbox`, which the admin panel lists. A real email adapter (Kodarvia) can implement the same port later.

## Public routes

`/` list, `/actividad/:id` detail and sign-up, `/cancel/:token` view or cancel a registration, `/offer/:token` confirm an offered seat, `/survey/:token` post-event survey, `/admin` panel.

## Admin PIN (not real security)

`/admin` is gated by `VITE_ADMIN_PIN` (default `1234` in `.env.example`), remembered in `sessionStorage`. The PIN is compiled into the client bundle, so anyone who inspects the page can read it. It only keeps casual visitors out. Real protection needs server-side authentication.

## Limitation: localStorage only

All data lives in the browser's `localStorage`. Public visitors and the admin only share data when they use the same browser profile, and concurrency is guaranteed only across tabs of that browser. Cross-device use requires a shared backend: implement the repository and lock ports with a Supabase adapter (for example, a transactional function for registrations) and swap it in `container.ts`. Domain and use cases do not change.

## Testing

TDD: domain rules and use cases were written test-first. Unit and integration tests live next to the code (`*.test.ts(x)`). E2E (`e2e/`) runs three Playwright projects: `desktop-chromium`, `mobile-pixel` (Pixel 7) and `mobile-iphone` (iPhone 14 viewport, user agent and touch emulation on Chromium, so only Chromium must be installed: `npx playwright install chromium`).

## Deploy on Netlify

1. Push the repository and create a site from it in Netlify.
2. Build settings are read from `netlify.toml` (`npm run build`, publish `dist`, Node 20, SPA redirect `/* -> /index.html 200`).
3. In Site settings, Environment variables, set `VITE_ADMIN_PIN` to your PIN.
4. Deploy. Remember the data is per browser (see the limitation above).
