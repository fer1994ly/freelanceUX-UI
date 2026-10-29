# Feature: event-registration

## Objective
Self-service registration for workshops/events of a freelance UX/UI studio (Mar del Plata, AR): public listing, 1-minute mobile sign-up, automatic waitlist with 24 h confirmation window, QR check-in, admin panel, CSV export, post-event survey. Deploy on Netlify.

## Problem / Why
Seats are managed over chat messages: overbooking and people left out without knowing.

## Scope (authorized)
- Public list of upcoming activities + activity detail page.
- Registration (name, email, phone, consent) -> on-screen confirmation with QR + cancellation link.
- Automatic waitlist; when a seat frees, first in line gets a 24 h offer to confirm (lazy expiry on read via Clock port).
- Cancellation from link (`/cancel/:token`).
- Admin panel: create & duplicate activities (copy everything except date and registrations), view registrants & waitlist, check-in by QR scan or manual toggle, CSV export (registrants, waitlist, attendance).
- Short post-event survey.
- Emails: NOT sent. `Notifier` port + outbox adapter (Kodarvia connects real email later).

## Constraints
- Persistence: localStorage only (user decision 2026-10-29). Data lives in one browser: public and admin share data only on the same browser. Documented limitation.
- Concurrency: guarded within one browser across tabs with Web Locks API (`navigator.locks`) + optimistic version check in the repository adapter. Cross-device guarantee requires a shared backend (future Supabase adapter behind the same port).
- Architecture: DDD vertical slices (`activities`, `registrations`, `attendance`, `surveys`, `reporting`) + `shared` kernel; ports & adapters; SOLID.
- Stack: Vite + React + TypeScript, React Router, Vitest + Testing Library, Playwright (desktop Chromium + mobile emulation Pixel 7 / iPhone 14).
- Admin access: simple PIN (`VITE_ADMIN_PIN`), not real security (client-side only). Documented.
- Code/identifiers/tests in English; UI copy and user guide in neutral Spanish (end users are Spanish speakers).
- Deploy: Netlify (`netlify.toml`, SPA redirect).

## TDD
- Mode: ON. Source: user global CLAUDE.md ("Strict TDD Mode: enabled") + user request ("AI TDD").
- Runner: `npm test` (Vitest) for unit/integration; `npm run test:e2e` (Playwright).

## Delivery
- Strategy: ask-on-risk. No git remote yet -> no PRs; work-unit commits on `feat/event-registration`.
- RDD: on (global). Assess after each work-unit commit.

## Tasks
- [x] T1 Scaffold: Vite React TS, Vitest, Playwright (desktop + mobile projects), ESLint, netlify.toml, folder structure.
- [x] T2 Activities slice: Activity aggregate, create/list upcoming/get/duplicate use cases, localStorage repo. Unit + integration tests.
- [x] T3 Registrations slice: register (capacity invariant), waitlist, cancel, promote with 24 h offer, confirm offer, expiry cascade, Notifier outbox, cross-tab lock. Unit + integration tests (incl. concurrent last-seat).
- [x] T4 Attendance slice: QR token check-in single-use, manual toggle. Tests.
- [x] T5 Reporting: CSV export (registrants, waitlist, attendance). Tests.
- [x] T6 Surveys: short post-event survey (rating + comment), link from confirmation after event. Tests.
- [x] T7 UI: public list, detail, registration form (mobile-first), confirmation with QR, cancel page, admin panel (activities, duplicate, registrants, waitlist, check-in with camera scan + manual, export, outbox). Component tests.
- [x] T8 E2E desktop + mobile: register flow < 1 min, two simultaneous registrations on last seat (two tabs), waitlist promotion, QR single use, duplicate, CSV export.
- [x] T9 Docs: README (dev, test, deploy Netlify) + GUIA-DE-USO.md (Spanish).

## Acceptance criteria
- Capacity never exceeded: two simultaneous registrations on last seat -> exactly one confirmed, one waitlisted.
- On freed seat, first waitlisted gets notification (outbox) and 24 h to confirm.
- QR validates at check-in and cannot be used twice.
- Duplicate copies everything except date and registrations.
- Export contains registrants, waitlist and attendance.
- Mobile registration < 1 minute (E2E timing assertion).

## Route declaration
- T1–T9: delegated direct (writer trigger: 2+ non-trivial files; one writer).

## Progress / Evidence
- T1 (9c9a113): lint, tsc, build OK; npm test RED (4 files failed, modules missing) -> GREEN 6 tests. iPhone project runs on Chromium emulation (webkit not installed). Lint fix for playwright.config in next commit.
- T2: RED (3 files failed) -> GREEN: 7 files, 24 tests; lint+tsc OK. Repos are async ports; VersionedCollection does optimistic versioning.

- T3: RED (2 files failed to load) -> GREEN. Test found a real bug: BookRepository.save awaited between version check and write (both concurrent writers passed); fixed by synchronous check+write. Final: 9 files, 50 tests pass; lint+tsc OK. Dcbf014 = T2 commit.

- T3 commit: eec3d04.
- T4: RED (2 files failed to load) -> GREEN: 11 files, 59 tests; lint+tsc OK. Single-use QR, confirmed-only, concurrent double scan yields one success.

- T4 commit: 7d4a518. T5 commit: 2c6fb01 (RED 2 files failed -> GREEN, 64 tests).
- T6: RED (2 files failed) -> GREEN: 15 files, 75 tests; lint+tsc OK. Survey id = registration id so a duplicate answer is rejected atomically. Survey requires a confirmed registration and activity date reached (check-in not required).

- T6 commit: 6062ecf.
- T7: component/integration tests written first, RED (10 failed: AppRoutes missing) -> GREEN: 18 files, 88 tests; tsc + lint OK. Extra rule added test-first: registration closed for past/unpublished activities. Seed tests were written alongside the seed code (not strictly RED-first). Cancel page uses a two-step confirm to avoid accidental cancellation.

- T7 commit: c9335ec.
- T8: Playwright 3 projects x 6 specs = 18 tests; two consecutive full runs 18 passed. E2E found two real mobile CSS bugs (flex on td; overflowing long link) fixed. iPhone 14 profile runs on Chromium (webkit not installed). Last-seat race, cancel->offer (outbox + admin status), single-use QR (manual code), duplicate, CSV all covered; registration flow timing asserted < 60 s.

- T8 commit: bee8000.
- T9: README.md + docs/GUIA-DE-USO.md written. Final verification: lint OK, tsc OK, npm test 18 files / 88 tests pass, build OK, test:e2e 18 passed.

- Follow-ups F1-F4 (each RED observed first, then GREEN): F1 39a8dd3 (CheckInTab test: 3 failed -> 3 pass; in-flight guard + 3 s same-token dedupe, injectable Scanner/now); F2 ca87ea7 (3 failed -> pass; best-effort publish, ErrorReporter port, default console.error); F3 b8e9554 (1 failed -> pass; alert "No se pudo exportar el CSV. Intenta de nuevo."); F4 4ed4520 (tests added for navigator.locks delegation, fallback, key independence; they passed on first run, no bug found, so no RED). Final: lint OK, tsc OK, npm test 20 files / 98 tests, build OK, test:e2e 18 passed.

## Next step
User review; decide on push/PR (no remote configured). Assess review risk per work-unit commit if RDD is on.

## Native review (RDD)
Full branch (8133 lines) exceeded the reviewer context budget, so it was reviewed in three committed slices. Each slice was medium risk; consent was granted, the review-reliability lens ran, and the result was approved and acknowledged (authority burned).
- S1 `acbfd84..9c9a113` (scaffold): approved. Lineage review-6d328fc5f3a78f04.
- S2 `9c9a113..6062ecf` (domain slices): approved. Lineage review-5a88b77fa832b593.
- S3 `6062ecf..c25fd61` (UI, E2E, docs): approved. Lineage review-7a33a7980618c0f5.

### Advisory follow-ups (non-blocking)
- [x] F1 (WARNING) Camera scanner re-fires check-in on every frame, so a valid first scan shows "ya fue utilizado". Add an in-flight guard and last-token dedupe (`src/app/admin/CheckInTab.tsx`).
- [x] F2 (WARNING) The notifier failing after save surfaces an error even though the registration persisted (`registrationService.ts` publish-after-save).
- [x] F3 (WARNING) CSV export has no error handling and fails silently (`RegistrantsTab.tsx`).
- [x] F4 (WARNING) BrowserLockManager is untested (navigator.locks path and fallback); there is no test for different keys running concurrently.
- [ ] F5 (SUGGESTION) The registration_closed check runs outside the lock; re-check it inside the mutation.
- [ ] F6 (SUGGESTION) Only one retry on ConcurrencyError; readJson does not fall back on a stored null; vi.unstubAllGlobals belongs in afterEach; message bodies are untested (the QR text points at the cancel path?); an unhandled seed rejection; the form shows nothing when the registration view is missing.
- Resolved in S3: S2 finding "register accepts cancelled/draft/past activities" (registration_closed guard added).
