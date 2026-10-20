---
name: triage
description: Turn a raw idea, feedback or bug report into well-formed GitHub issues (user stories with acceptance criteria) ready for the agent:implement label.
---

# Triage into agent-ready issues

1. Read `docs/requirements.md` to avoid duplicates and to keep numbering (US-n).
2. Split the input into independently shippable stories (each ≤ ~1 day of work).
3. For each, write:
   - Title: `US-n: <short capability>` (bugs: `fix: <symptom>`)
   - Story: "As a user I want … so that …"
   - Acceptance criteria: Given/When/Then, each testable in mock mode or as a unit test.
   - Notes: affected modules, risks, out of scope.
4. Create with `gh issue create --template user-story.yml` equivalent fields
   (`gh issue create --title … --body … --label user-story`).
5. If a story is unambiguous and does not touch owner-gated areas, add the label
   `agent:implement` so the autonomous pipeline picks it up. Otherwise add `needs-owner`
   and state the open question in the issue.
6. Append the new stories to `docs/requirements.md` with status `planned` via a PR.
