---
description: Start a work item - move it to in-progress and create the linked branch
argument-hint: "<item id>"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit"]
---

<!-- Generated from src/commands/tracker/start.md by scripts/build.mjs. Edit the source, not this file. -->

# Start work

**Item:** $ARGUMENTS

1. **Read the item.** Show the user the title, description and acceptance criteria before anything changes. If it has no acceptance criteria and is not trivial, run `/sdlc:spec` first - starting on an item nobody has scoped is how a day disappears.
2. **Check the tree is clean.** Uncommitted changes from other work: stop and let the user decide (a WIP commit or a separate worktree - never a bare `git stash`, the stack is shared).
3. **Check nothing else is `in-progress`.** If something is, say what, and ask whether to park it.
4. **Create the branch** from an up-to-date default branch:
   ```
   <type>/<ID>-<short-slug>      e.g. feat/TASK-42-saved-searches
   ```
   Type from the item: `feat`, `fix`, `chore`, `refactor`.
5. **Move the item to `in-progress`** and record the branch on it.
   - local: `move <ID> in-progress`, then `set <ID> branch=<branch>`
   - jira: assign to self and transition (read the legal transitions first). Confirm with the user before writing - it notifies the team.
6. **Report** the branch, the item, the acceptance criteria, and the next command (`/sdlc:spec` if there is no spec, otherwise `/sdlc:plan` or `/sdlc:implement`).

Do not begin implementing in this command. Starting is a state change; building is the next decision.
