---
name: tracker-pick
description: Show what to work on next, or capture a new work item. Use when the user asks for the tracker "pick" step by name, or reaches that stage of the SDLC loop.
---

<!-- Generated from src/commands/tracker/pick.md by scripts/build.mjs. Edit the source, not this file. -->

# Pick the next item

**Input:** the user's request

Read `.sdlc/tracker.json` for the backend. Follow `tracker-workflow`.

## If an argument was given, capture it

Create the item with a clear title, a type, and a priority. Ask for the acceptance criteria only if they are not obvious from the request - a captured item in `backlog` is allowed to be rough; it becomes `ready` when someone understands it.

- **local:** `node "./scripts/tracker.mjs" new "<title>" --type <type> --priority <P1..P4>`
- **jira:** show the exact create payload and ask before sending it.

## Otherwise, pick

1. **Check for work already in flight.** Anything `in-progress` is reported first: finishing beats starting.
2. **List `ready` items**, highest priority first.
   - local: `node "./scripts/tracker.mjs" next`
   - jira: `project=PROJ AND status="Ready" AND assignee IS EMPTY ORDER BY priority DESC`
3. **Report the top few** with id, priority, title, and whether a spec exists.
4. **Recommend one**, and say why - priority, unblocking others, or being a prerequisite for the rest.

Do not start work here. `the `tracker-start` skill <id>` is the deliberate next step, so that picking and committing are separate decisions.

If nothing is `ready`, say so plainly: the backlog needs grooming, and that is the actual next task.
