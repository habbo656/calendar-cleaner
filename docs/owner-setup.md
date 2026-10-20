# Owner setup (one-time gates)

Everything after this is autonomous: issues labelled `agent:implement` are built,
reviewed, merged and deployed without you. These steps need a human once.

## 1. GitHub repository (≈2 min, scripted)

```sh
./scripts/bootstrap-github.sh            # creates the repo, Pages, labels, branch protection
```

It configures: public repo, Pages via Actions, squash-only + auto-merge + delete branch on
merge, labels (`agent:implement`, `automerge`, `needs-owner`, `user-story`, `bug`),
branch protection on `main` requiring checks `ci` and `review`, CODEOWNERS review for
owner-gated paths.

## 2. Claude GitHub App + token (≈2 min)

In Claude Code, inside this repo, run `/install-github-app`. It installs the Claude
GitHub App and stores the `CLAUDE_CODE_OAUTH_TOKEN` secret. (Alternative: create an API
key and adapt the workflows to `anthropic_api_key`.)

Why the App matters: PRs opened with the default `GITHUB_TOKEN` do not trigger CI. The
Claude App's token does, which is what makes the autonomous loop close.

## 3. Google Cloud OAuth client (≈10 min)

1. https://console.cloud.google.com → create a project (e.g. "calendar-cleaner").
2. _APIs & Services → Library_ → enable **Google Calendar API**.
3. _Google Auth Platform → Branding_: app name, support e-mail. _Audience_: External,
   status **Testing**, add yourself (and anyone else) as **test users**.
4. _Data access_ → add scopes `…/auth/calendar.calendarlist.readonly` and
   `…/auth/calendar.events`.
5. _Clients → Create client → Web application_. Authorized JavaScript origins:
   - `https://habbo656.github.io`
   - `http://localhost:5173` and `http://localhost:4173`
   - your own server's origin, if any
     (No redirect URIs needed for the token model.)
6. Copy the client ID and run:
   ```sh
   gh variable set GOOGLE_CLIENT_ID --body "<id>.apps.googleusercontent.com"
   gh workflow run "CI & Deploy"
   ```

Publishing to arbitrary users (beyond 100 test users) requires Google's verification for
the sensitive `calendar.events` scope — a deliberate owner decision, not needed for
personal use.

## Ongoing owner gates

Only PRs labelled `needs-owner` / touching CODEOWNERS paths wait for you:
CI & permissions, OAuth scopes, ADRs. Everything else ships on green.
