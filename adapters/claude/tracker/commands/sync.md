---
description: "Push the repository's state - branch, PR, status - back onto the work item"
argument-hint: "[optional: item id; defaults to the id in the branch name]"
allowed-tools: ["Read","Grep","Glob","Bash","Write","Edit"]
---

<!-- Generated from src/commands/tracker/sync.md by scripts/build.mjs. Edit the source, not this file. -->

# Sync the item

**Item:** $ARGUMENTS (if empty, derive the id from the current branch name)

Keep the tracker no more than one action behind reality. A tracker that lags is one people stop trusting, and then stop reading.

1. **Determine the item** from the argument or the branch name. If neither yields an id, say so and stop rather than guessing.
2. **Gather the true state** from the repo: current branch, whether it is pushed, open PR (via `gh pr view` if available), review state, and whether the gates were run in this session.
3. **Work out the correct item state:**
   | Repo reality | Item state |
   | --- | --- |
   | Branch exists, no PR | `in-progress` |
   | PR open | `in-review` |
   | PR merged | `done` - but only with the user's confirmation |
   | Waiting on someone or something | `blocked`, with the blocker named |
4. **Show the user the exact changes** you propose - state transition, fields, and any comment text.
5. **Apply them after a yes.**
   - local: `move` and `set` via the tracker script.
   - jira: transition by id and post an ADF comment. Every write leaves the machine and notifies people - confirm each one.
6. **Never close on your own judgement.** `done` requires a merged PR and an explicit human confirmation.
7. **Report** what changed and what the item now says.

Keep comments useful and few: PR opened, PR merged, blocked with the reason, decision recorded. A comment on every push is noise that trains people to mute the ticket.
