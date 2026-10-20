# AGENTS.md — calendar-cleaner

Instructions for AI coding agents (Claude Code, Codex, etc.) and humans.

## Product

A **backend-less single-page app** that cleans up a Google Calendar:

- **US-1** remove duplicate events from a selected calendar
- **US-2** remove expired (past) events so an iCal export stays small

Requirements and acceptance criteria: `docs/requirements.md`.
Architecture and module map: `docs/architecture.md`. Decisions: `docs/decisions/`.

## Hard constraints (never violate)

1. **No backend.** Static files only. Must run on GitHub Pages (sub-path!), any static
   web server, or `npm run dev`. Asset paths stay relative (`base: './'`), no
   server-side routing (single view, no router needed).
2. **User data stays in the browser.** Only the Google Calendar API and Google
   Identity Services may be contacted. No analytics, no telemetry, no other CDNs.
3. **Never delete what the user did not review.** Deletion always shows the exact list
   first, requires a two-step confirmation, and offers a JSON backup. When unsure
   whether an event qualifies (unparsable recurrence, missing dates) → keep it.
4. **Access token in memory only** — never write it to storage, URLs or logs.

## Commands

| Task                   | Command                                                      |
| ---------------------- | ------------------------------------------------------------ |
| Dev server (real API)  | `npm run dev` → http://localhost:5173                        |
| Dev server (mock data) | `npm run dev:mock` → http://localhost:5173/?mock             |
| All quality gates      | `npm run check` (format, lint, typecheck, unit, build, e2e)  |
| Unit tests             | `npm test` / `npm run test:watch`                            |
| E2E tests              | `npm run e2e` (needs `npx playwright install chromium` once) |
| Format                 | `npm run format`                                             |

**Definition of done:** `npm run check` is green, new logic is unit-tested, user-visible
behaviour has an e2e test, docs updated.

## Mock mode — how agents test without Google

Append `?mock` to the URL. `src/google/mockApi.ts` replaces the Google API with an
in-memory calendar fixture (documented at the top of that file). All e2e tests use it.
**You never need real Google credentials** to develop or verify a change. If a feature
needs new data shapes, extend the fixture and adjust counts in existing e2e tests.

## Code map

```
src/core/     pure domain logic (duplicates, expired, recurrence, queue, backup) — unit tested
src/google/   Google boundary: types, OAuth (GIS token model), REST client, mock
src/ui/       React components (no business logic beyond wiring)
src/config.ts runtime config (config.json / ?clientId= / localStorage / VITE_ env)
e2e/          Playwright tests against the built app in mock mode
```

Conventions: TypeScript strict, functional React with hooks, no state library, plain CSS
(`src/styles.css`, CSS variables, light/dark). Keep dependencies minimal — adding a
runtime dependency needs a short justification in the PR.

## Workflow (autonomous by default)

- Work on a branch, never commit to `main`. Conventional Commits.
- Use the `implement-story` skill for any feature/bug; `triage` to turn ideas into issues.
- Run the `reviewer` subagent before opening a PR.
- Open PRs with label `automerge`: they merge automatically once **CI** and the
  **Claude review** check pass. No human approval needed.

## Owner gates (the only places to stop and involve the owner)

Do not label these PRs `automerge`; label `needs-owner` (CODEOWNERS enforces this):

1. Changes to `.github/` (CI, permissions, deploy) or `.claude/settings.json`
2. New or broader **OAuth scopes** (`src/google/auth.ts`) — affects Google verification
3. New ADRs / reversing an ADR (`docs/decisions/`)
4. Anything that would weaken a hard constraint above

Everything else: decide, document the decision in the PR, ship.
