# 0004 — Runtime configuration via config.json

Status: accepted · 2026-10-20

## Context

Each deployment (Pages, localhost, own server) may use a different Google OAuth client.
Rebuilding per host would complicate self-hosting.

## Decision

The client ID is resolved at runtime: `?clientId=` → localStorage (entered in the UI) →
`./config.json` → build-time `VITE_GOOGLE_CLIENT_ID`. The Pages deploy writes
`config.json` from the repository variable `GOOGLE_CLIENT_ID`.

## Consequences

- One build artifact for every host; Docker users mount their own `config.json`.
- The client ID is not a secret (it is visible in every OAuth request anyway).
