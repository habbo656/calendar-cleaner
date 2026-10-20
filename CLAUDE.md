@AGENTS.md

## Claude Code specifics

- Project permissions, deny-list and a Prettier auto-format hook live in
  `.claude/settings.json`. Personal overrides go in `.claude/settings.local.json` (git-ignored).
- Skills: `/implement-story <issue|text>`, `/triage <idea>`. Subagent: `reviewer`.
- To see the UI, run `npm run dev:mock` (or build + `npm run preview`) and open `/?mock`.
