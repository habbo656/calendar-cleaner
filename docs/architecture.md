# Architecture

```
Browser (static SPA, React + TypeScript, built by Vite)
 ├─ config.ts ───────── runtime config: ?clientId → localStorage → ./config.json → VITE_GOOGLE_CLIENT_ID
 ├─ google/auth.ts ──── Google Identity Services token client (OAuth 2 implicit/token model)
 ├─ google/calendarApi  fetch-based REST client: pagination, retry/backoff, 401 → re-auth
 ├─ google/mockApi ──── in-memory fake (enabled by ?mock) for dev + e2e
 ├─ core/* ──────────── pure logic: duplicates, expired, recurrence, runQueue, backup
 └─ ui/* ───────────── React components, two-step delete flow (DeleteBar)
        │
        └── HTTPS ──► googleapis.com/calendar/v3   (no own backend)
```

## Data flow

1. **Sign in** – GIS pops up Google consent; we receive a short-lived access token
   (≈1 h) held only in a closure. Scopes:
   `calendar.calendarlist.readonly` (list calendars) and `calendar.events` (delete events).
2. **Pick calendar** – `calendarList` filtered to `minAccessRole=writer`.
3. **Scan** – `events.list` with `singleEvents=false`, so we see series masters, their
   exceptions and single events — never thousands of expanded instances. Paginated
   (2500/page), with a `fields` mask to keep payloads small.
4. **Analyse** – pure functions in `src/core` produce candidates. UI pre-selects them.
5. **Delete** – `events.delete?sendUpdates=none`, 4 in parallel, exponential backoff on
   429/403-rate-limit/5xx, 404/410 treated as success. Deleting a series master removes
   all its instances.

## Why these choices

See `docs/decisions/`:

- 0001 static SPA without backend
- 0002 GIS token model for OAuth
- 0003 mock API as the testing seam
- 0004 runtime config.json for hosting portability

## Hosting

`base: './'` → identical build works at `/`, `/calendar-cleaner/` (Pages) or any
sub-path. The only per-deployment value is the OAuth client ID in `config.json`, and each
origin must be registered in the Google Cloud OAuth client.
