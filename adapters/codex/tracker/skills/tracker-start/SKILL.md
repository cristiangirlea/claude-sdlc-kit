---
name: "tracker-start"
description: "Start a work item - move it to in-progress and create the linked branch. Use when the user asks for the tracker \"start\" step by name, or reaches that stage of the SDLC loop."
---

<!-- Generated from src/commands/tracker/start.md by scripts/build.mjs. Edit the source, not this file. -->

## Runtime paths

Resolve [the tracker CLI](../../scripts/tracker.mjs) relative to this SKILL.md. Replace `<absolute plugin resource root>` in commands with the absolute directory containing that `scripts/` folder. Keep the working directory at the user's project root; never change into the plugin to run the tracker. Use `--root "<absolute project root>"` when running from elsewhere.


# Start work

**Item:** the user's request

1. **Read the item.** Show the user the title, description and acceptance criteria before anything changes. If it has no acceptance criteria and is not trivial, run `the `sdlc-spec` skill` first - starting on an item nobody has scoped is how a day disappears.
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
6. **Report** the branch, the item, the acceptance criteria, and the next command (`the `sdlc-spec` skill` if there is no spec, otherwise `the `sdlc-plan` skill` or `the `sdlc-implement` skill`).

Do not begin implementing in this command. Starting is a state change; building is the next decision.
