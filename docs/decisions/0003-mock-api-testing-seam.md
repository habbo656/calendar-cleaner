# 0003 — Mock calendar API as the testing seam

Status: accepted · 2026-10-20

## Context

Agents and CI cannot complete an interactive Google consent. Without a seam, nothing
user-facing could be verified autonomously, which would force owner gates on every PR.

## Decision

All Google I/O goes through the `CalendarApi` interface. `?mock` swaps in an in-memory
implementation with a documented fixture. Playwright e2e tests run the production build
in mock mode. The real client is covered by unit tests with a stubbed `fetch`.

## Consequences

- Full UI flows are testable headlessly and deterministically → autonomous merging.
- Demo mode for users who want to try the app before granting access.
  − Mock and real API can drift; keep `src/google/types.ts` aligned with the API docs and
  add a unit test whenever the real client's behaviour changes.
