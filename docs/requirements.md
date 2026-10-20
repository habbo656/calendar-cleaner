# Requirements

Status values: `planned` · `in progress` · `done`.

## Product constraints

- C-1 No backend; static SPA hosted on GitHub Pages; also runnable locally and on any
  static web server (see `docs/self-hosting.md`).
- C-2 Calendar data is processed only in the browser; only Google APIs are contacted.
- C-3 Nothing is deleted without the user reviewing the exact list and confirming twice.
- C-4 Only calendars the user can write to (owner/writer) are offered.

## US-1 — Remove duplicate entries · `done`

> As a user I want to remove duplicate entries on a selected Google Calendar so that I
> have a clean calendar.

Acceptance criteria

1. Given a selected calendar, when I scan it, then events with the same title (ignoring
   case and surrounding/multiple whitespace), the same start and the same end instant
   are grouped as duplicates.
2. Recurring series are duplicates only if their recurrence rules are identical too.
   Modified instances (exceptions) and cancelled entries are never grouped on their own.
3. Optionally I can additionally require identical location and/or description.
4. In each group the oldest copy (by creation time) is kept and shown as "kept"; all
   others are pre-selected for deletion and can be deselected individually.
5. I can download a JSON backup of the selected events before deleting.
6. Deleting requires a second confirmation click; progress is shown; failures are
   reported without aborting the remaining deletions; the list refreshes afterwards.

Tests: `src/core/duplicates.test.ts`, `e2e/cleanup.spec.ts` (US-1).

## US-2 — Remove expired entries · `done`

> As a user I want to remove expired calendar entries from a selected Google Calendar
> so that an iCal export has as few entries as possible.

Acceptance criteria

1. An event is expired when it ended before the cutoff. The default cutoff is the start
   of today; I can choose "ended more than N days ago".
2. All-day events use their (exclusive) end date.
3. A recurring series is expired only when its last occurrence (by UNTIL/COUNT) and all
   of its modified instances ended before the cutoff. Series without an end never expire.
   Deleting a series deletes all its instances; the UI shows how many exceptions go with it.
4. I can exclude recurring series entirely.
5. Anything that cannot be evaluated safely (unparsable rule, missing end) is kept.
6. Same review/backup/confirm/delete flow as US-1.

Tests: `src/core/expired.test.ts`, `e2e/cleanup.spec.ts` (US-2).

## Backlog ideas (not yet stories)

- Preview counts for both tools at once after scanning.
- Search/filter within results (e.g. only events containing a keyword).
- Restore from a backup JSON file.
- Use Google batch endpoint for faster deletion of very large sets.
- Detect "near duplicates" (same title, overlapping times).
