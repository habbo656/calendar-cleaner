# 🧹 Calendar Cleaner

Remove **duplicate** and **expired** events from a Google Calendar — entirely in your
browser. No backend, no tracking; your data goes only between your browser and Google.

**Use it:** https://habbo656.github.io/calendar-cleaner/ · **Try with fake data:** add `?mock`

## Features

- **Duplicates** — same title, start and end (optionally location/description). Keeps the
  oldest copy, understands recurring series.
- **Expired** — events that ended before a cutoff, including finished recurring series;
  ideal for slimming down iCal exports. Unbounded series are never touched.
- Review list with per-event selection, JSON backup download, two-step confirmation.

## Run it yourself

```sh
npm ci
npm run dev:mock     # fake calendar, no Google account needed
npm run dev          # real calendar (needs a Google OAuth client ID)
```

Static hosting, Docker and Google setup: [`docs/self-hosting.md`](docs/self-hosting.md).

## Development

This repo is set up for **agentic engineering**: AI agents implement, test, review,
merge and deploy autonomously; the owner only gates CI/permission changes, OAuth scopes
and architecture decisions.

- Agent guide & conventions: [`AGENTS.md`](AGENTS.md)
- Requirements: [`docs/requirements.md`](docs/requirements.md) · Architecture:
  [`docs/architecture.md`](docs/architecture.md) · ADRs: [`docs/decisions/`](docs/decisions)
- One-time setup: [`docs/owner-setup.md`](docs/owner-setup.md)

```
issue (user story) ──label agent:implement──► Claude implements on a branch
      ▲                                              │ tests first, npm run check
      │                                              ▼
  /triage idea                         PR (label automerge)
                                                     │ CI  +  Claude review (required checks)
                                                     ▼
                                     auto-merge to main ──► deploy to GitHub Pages
```

Quality gate: `npm run check` (format, lint, typecheck, unit tests, build, e2e).
