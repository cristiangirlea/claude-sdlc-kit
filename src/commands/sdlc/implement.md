---
description: "Implement a slice from the plan, test-first, leaving the repo green"
argument-hint: "[slice number or description; defaults to the next unfinished slice]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit", "Task", "TodoWrite"]
---

# Implement a slice

**Slice:** {{ARGS}} (if empty, take the next unchecked slice in the plan)

Follow `tdd-workflow`. One slice per run. Nothing outside the slice enters the diff.

1. **Confirm the slice.** Restate what you are about to build, which files it touches, and the verification command. If the slice is bigger than half a day of work, split it and say so.
2. **Track it.** Put the slice's tasks in the todo list so progress is visible.
3. **Red.** Run the {{AGENT:test-author}} to write the failing tests for this slice's acceptance criteria. Require the reported failure to be behavioural - an import error is not a red test.
4. **Green.** Run the {{AGENT:task-implementer}} (or implement directly for a small slice) with an explicit file scope. Minimum code to pass; no scope creep; no weakening of tests.
5. **Refactor** under a green suite if the code needs it. No new behaviour in this step.
6. **Verify** with `{{CMD:sdlc:verify}}` - build, lint, type-check, full test suite. Green means observed green.
7. **Report:** files changed, tests added and their result, deviations from the plan, and anything you noticed but deliberately did not touch (each of those becomes a tracker item, not a silent edit).

**Parallel slices:** only when their file sets are disjoint and neither defines a type the other consumes. Give each agent its scope explicitly, then re-run the full gate after both land.

**Stop and ask** if: the design turns out to be wrong, a new dependency is required, the slice needs a production change to be testable, or the work would exceed the agreed scope.
