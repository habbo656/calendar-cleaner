# 0001 — Static SPA without backend

Status: accepted · 2026-10-20

## Context

The owner requires: no backend, hosting on GitHub Pages, also runnable locally or on an
own server. The app deletes data in a third-party account, so users must be able to
trust it.

## Decision

Build a pure client-side SPA (Vite + React + TypeScript). All Google API calls are made
directly from the browser with the user's own OAuth token.

## Consequences

- Zero operating cost, trivial self-hosting, no server-side data handling.
- Privacy story is simple: data never touches our infrastructure.
  − No refresh tokens / offline access: users re-consent after ~1 h of use (acceptable for
  an interactive cleanup tool).
  − No scheduled/automatic cleanups (would need a backend).
