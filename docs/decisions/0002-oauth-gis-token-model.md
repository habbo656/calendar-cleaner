# 0002 — OAuth via Google Identity Services token model

Status: accepted · 2026-10-20

## Context

Without a backend we cannot keep a client secret, so the authorization-code flow with
a confidential client is not possible.

## Decision

Use the GIS **token model** (`google.accounts.oauth2.initTokenClient`). Request the
narrowest scopes that work: `calendar.calendarlist.readonly` + `calendar.events`.
Keep the access token in memory only; revoke on sign-out.

## Consequences

- Works on any static origin registered as "Authorized JavaScript origin".
- Narrow scopes: cannot change calendar settings or ACLs.
  − `calendar.events` is a _sensitive_ scope: a public instance for arbitrary users needs
  Google OAuth app verification; until then the app runs in "Testing" mode with up to
  100 listed test users (fine for personal / self-hosted use).
  − Changing scopes is an owner gate (CODEOWNERS on `src/google/auth.ts`).
