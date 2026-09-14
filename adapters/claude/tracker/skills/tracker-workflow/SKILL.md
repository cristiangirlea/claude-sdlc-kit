---
name: "tracker-workflow"
description: "The backend-agnostic issue model this kit uses - work item states and their meaning, the id that ties tracker item to branch to commits to PR, what belongs in an item versus a spec, and the rules for keeping the tracker honest. Use when picking up work, creating or updating a work item, wiring a branch to an item, reporting status, or deciding which backend (local files or Jira) an action should hit."
---

<!-- Generated from src/skills/tracker-workflow/SKILL.md by scripts/build.mjs. Edit the source, not this file. -->

# Tracker workflow

Every piece of work has an **id** before code is written. The id ties together the tracker item, the branch, the commits, the PR and the spec. Without it, six months later nobody can answer "why does this code exist".

## Backends

One command surface, two backends, chosen in `.sdlc/tracker.json`:

```json
{ "backend": "local", "prefix": "TASK", "dir": "docs/tracker" }
```

- **`local`** (default) - markdown files in `docs/tracker/`, driven by `scripts/tracker.mjs`. No service, no credentials, diffs and reviews like code. This is what works today.
- **`jira`** - the same commands against Jira. See the `jira-integration` skill for setup and field mapping.

Work the same way regardless of backend. Only the sync step differs.

## States

| State | Means | Entry condition |
| --- | --- | --- |
| `backlog` | Captured, not yet understood | Someone wrote it down |
| `ready` | Understood well enough to start | Has a goal, a size, and acceptance criteria or a spec link |
| `in-progress` | Someone is actively on it | A branch exists; **at most one per person** |
| `in-review` | Code exists, awaiting review | PR open, gates green |
| `blocked` | Cannot proceed | The blocker is named, with who or what would unblock it |
| `done` | Merged and verified | Definition of done satisfied |

Two rules that keep states meaningful: **one `in-progress` item at a time** (parallel work is how things get abandoned at 80%), and **`blocked` must name the blocker** (a blocked item with no named blocker is an item nobody is thinking about).

## Item versus spec

| Goes in the tracker item | Goes in the spec |
| --- | --- |
| Title, type, priority, status | Detailed behaviour |
| One-paragraph description | Edge cases and failure modes |
| Link to the spec | Full acceptance criteria |
| Branch, PR, dependency links | Non-functional requirements |
| Decision log and blockers | Data and rollout impact |

Small items need no spec - the item's own acceptance criteria are enough. Anything that would take more than a day, or that changes a contract, gets a spec.

## The id flows through everything

```
TASK-42                                    tracker item
feat/TASK-42-saved-searches                branch
feat(store): add saved search repository   commit ... Refs: TASK-42
[TASK-42] Add saved searches               PR title
docs/specs/SPEC-TASK-42-saved-searches.md  spec
```

## Rules

1. **No work without an item.** Two minutes to create one; that is the whole cost of traceability.
2. **Move the state when reality changes, not at the end of the day.** A tracker that lags reality is worse than no tracker: people make decisions from it.
3. **Discoveries become items, not scope creep.** Found a related bug mid-slice? New item, linked, keep going. The exception is a defect that blocks the current slice.
4. **Close with evidence.** Moving to `done` names the PR and what verified it.
5. **Blocked is loud.** Name the blocker and who can clear it, in the item and to the user.
6. **Never invent an id.** If the backend assigns ids, get the real one before you write it into a branch name or a commit.

## Commands

| Command | Effect |
| --- | --- |
| `/tracker:setup` | Configure the backend for this repo |
| `/tracker:pick` | Show what to work on next, or create the item |
| `/tracker:start <id>` | `in-progress`, create the branch, link them |
| `/tracker:sync` | Push branch/PR/status from the local repo to the item |
| `/tracker:comment <id>` | Add a note to the item's log |
| `/tracker:report` | Standup-style summary of the current window |

## Local backend cheatsheet

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/tracker.mjs" list --status ready
node "${CLAUDE_PLUGIN_ROOT}/scripts/tracker.mjs" new "Add saved searches" --type feature --priority P2
node "${CLAUDE_PLUGIN_ROOT}/scripts/tracker.mjs" move TASK-42 in-progress
node "${CLAUDE_PLUGIN_ROOT}/scripts/tracker.mjs" set TASK-42 branch=feat/TASK-42-saved-searches pr=123
node "${CLAUDE_PLUGIN_ROOT}/scripts/tracker.mjs" comment TASK-42 "blocked on the auth decision"
node "${CLAUDE_PLUGIN_ROOT}/scripts/tracker.mjs" report --days 7
```

(`${CLAUDE_PLUGIN_ROOT}` resolves to the installed plugin's directory. Vendored into a project it is `.claude/plugins/tracker`.)
