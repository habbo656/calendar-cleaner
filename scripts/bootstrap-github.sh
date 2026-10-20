#!/usr/bin/env bash
# One-time GitHub setup for the autonomous pipeline. Idempotent; safe to re-run.
# Usage: scripts/bootstrap-github.sh [owner/repo]   (default: <your gh user>/calendar-cleaner)
set -euo pipefail

REPO="${1:-$(gh api user --jq .login)/calendar-cleaner}"
echo "→ Repository: $REPO"

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source . --remote origin \
    --description "Clean up Google Calendar: remove duplicate and expired events. Static SPA, no backend."
fi
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO.git"
git push -u origin main

echo "→ Merge settings (squash only, auto-merge, delete merged branches)"
gh api -X PATCH "repos/$REPO" \
  -F allow_auto_merge=true -F delete_branch_on_merge=true \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F has_issues=true >/dev/null

echo "→ Actions may create PRs"
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true >/dev/null

echo "→ GitHub Pages (source: GitHub Actions)"
gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 ||
  gh api -X PUT "repos/$REPO/pages" -f build_type=workflow >/dev/null

echo "→ Labels"
label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
label "agent:implement" 5319e7 "Claude implements this issue autonomously"
label "automerge" 0e8a16 "Merge automatically once required checks pass"
label "needs-owner" d93f0b "Waiting for an owner decision or review"
label "user-story" 1d76db "Feature written as a user story"
label "bug" d73a4a "Something is broken"

echo "→ Branch protection on main"
gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["ci", "review"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

cat <<MSG

✓ GitHub configured: https://github.com/$REPO
Next (see docs/owner-setup.md):
  1. In Claude Code run /install-github-app   (Claude App + CLAUDE_CODE_OAUTH_TOKEN secret)
  2. Create the Google OAuth client, then:
       gh variable set GOOGLE_CLIENT_ID --repo $REPO --body "<id>.apps.googleusercontent.com"
       gh workflow run "CI & Deploy" --repo $REPO
  App URL: https://${REPO%%/*}.github.io/${REPO##*/}/
MSG
