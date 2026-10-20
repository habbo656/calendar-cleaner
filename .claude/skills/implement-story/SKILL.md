---
name: implement-story
description: Implement a user story, bug or GitHub issue end-to-end — branch, tests first, code, verify, review, PR with auto-merge. Use when asked to build a feature, fix a bug, or work an issue.
---

# Implement a story end-to-end

Input: an issue number (`#12`), a story text, or a bug description.

1. **Understand**
   - `gh issue view <n> --comments` if an issue number was given.
   - Read `docs/requirements.md` and `docs/architecture.md`. Find the affected modules.
   - If acceptance criteria are missing, derive concrete, testable ones and write them
     into the PR description (do not stop to ask unless the story is contradictory or
     touches an owner-gated area — see AGENTS.md "Owner gates").

2. **Branch**: `git switch -c <type>/<issue>-<slug>` from an up-to-date `main`
   (`type` = feat | fix | chore | docs).

3. **Tests first**
   - Pure logic → `src/core/*.test.ts` (Vitest).
   - User-visible flow → `e2e/*.spec.ts` (Playwright, mock mode). Extend the fixture in
     `src/google/mockApi.ts` if needed and update its doc comment + any affected counts
     in existing e2e tests.
   - Run them and confirm they fail for the right reason.

4. **Implement** the smallest change that makes the tests pass. Keep domain logic in
   `src/core` (pure, no React, no fetch). UI in `src/ui`. Google I/O in `src/google`.

5. **Verify**: `npm run check` must pass. Fix and repeat until green. Never skip,
   disable or weaken a test to get green.

6. **Docs**: update `docs/requirements.md` (story + acceptance criteria, status) and
   `docs/architecture.md` if structure changed. Significant design decisions → new ADR
   in `docs/decisions/`.

7. **Self-review**: run the `reviewer` subagent on your diff; fix every must-fix item.

8. **Ship**
   - Commit with Conventional Commits (`feat: …`, `fix: …`), referencing the issue.
   - `git push -u origin HEAD`
   - `gh pr create --fill --label automerge` with a body following
     `.github/pull_request_template.md`, including "Closes #<n>" and the list of
     autonomous decisions. Omit `--label automerge` if the PR touches an owner-gated
     path (CODEOWNERS) — then add the label `needs-owner` instead.
   - `gh pr checks --watch`; if CI or the Claude review fails, fix, push, repeat.
