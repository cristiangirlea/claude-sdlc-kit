---
description: Prepare the change for merge - docs, commits, PR body, tracker update
argument-hint: "[optional: PR title]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit", "Task"]
---

# Ship it

**Title hint:** {{ARGS}}

Follow `git-workflow`. This command **prepares**; the user decides what actually leaves the machine.

1. **Check the gates first.** `{{CMD:sdlc:verify}}` must be green and `{{CMD:sdlc:review}}` must have no unaddressed blockers or majors. If either is unmet, stop and say so - do not prepare a PR for work that is not done.
2. **Update the docs.** Run the {{AGENT:docs-scribe}}: README, `.env.example`, API docs, changelog, runbooks, `{{MEMORY}}`. Only what this change actually invalidated.
3. **Inspect what would be committed.** `git status` and `git diff`. Nothing unintended: no `.env`, no credentials, no build output, no scratch file, no debug print.
4. **Commit** in atomic pieces, Conventional Commits, with the tracker id in the footer. Each commit builds. Refactors and behaviour changes never share a commit.
   - Commit only if the user asked for commits. If you are on the default branch, create a branch first.
5. **Draft the PR body** with What / Why / How / **Verification** / Risk and rollback / Notes for the reviewer. The Verification section carries the exact commands you ran and their observed output.
6. **Ask before anything outward-facing.** Pushing a branch, opening or updating a PR, and commenting on the tracker all leave this machine. Show the user what you are about to send and wait for a yes.
7. **Update the tracker** (`{{CMD:tracker:sync}}`) once the PR exists: status, PR link, anything deliberately deferred.

**Never** force-push a shared branch, rewrite published history, tag, or deploy. Prepare the commands and hand them to a human.
