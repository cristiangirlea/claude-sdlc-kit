---
name: task-decomposition
description: How to break an approved spec into vertical slices and tasks that each leave the repository green, name their own verification, and can be parallelised safely across agents. Use when turning a plan into a task list, when a piece of work feels too big to start, when work has stalled halfway through a large change, or when deciding what can run in parallel.
---

# Decomposing work

The unit is a **vertical slice**: a change that crosses every layer it needs to and leaves the repo building, tests passing, and (ideally) something demonstrable. Not "all the models", then "all the handlers", then "all the UI" - that horizontal split is untestable until the last step and unshippable until then too.

## Slice rules

1. **Green at every boundary.** After each slice, build + tests pass on the branch. If a slice cannot end green, it is two slices with a bad seam between them.
2. **Half a day or less.** Bigger than that and the review is unreviewable and the rollback is all-or-nothing.
3. **One reason to exist.** A slice that needs "and" in its title is two slices.
4. **Verification is part of the definition.** `Task - verified by <test name or command>`. No verification, no task.
5. **Order by risk, not by comfort.** Do the slice that could invalidate the design first: the unknown integration, the migration, the performance question. Discovering the design is wrong on day one is cheap; on day five it is not.
6. **Flag anything that lands half-built.** If a slice ships user-visible behaviour that is not finished, it goes behind a flag or it does not merge.

## A working decomposition

For "users can save a search and re-run it":

| # | Slice | Leaves green? | Verified by |
| --- | --- | --- | --- |
| 1 | Schema + migration for `saved_searches`, reversible | yes | migration up/down test |
| 2 | Store layer create/list/delete with ownership scoping | yes | store unit tests, incl. cross-user denial |
| 3 | API endpoints behind `saved_search` flag | yes | handler tests: 201/200/404/403 |
| 4 | Re-run: apply a saved search to the existing query path | yes | integration test comparing to live search |
| 5 | UI: save + list + re-run | yes | component tests + one e2e |
| 6 | Remove flag, changelog, docs | yes | full suite + manual smoke |

Note what slice 1 and 2 buy: the risky part (schema, ownership) is proven before any UI exists.

## Sizing signals

**Too big** - the task names more than three files you cannot list yet; you cannot state its verification; it contains "refactor" plus "add"; it spans more than one service; you would not want to review it in one sitting.

**Too small** - the task is a single line of a diff, its verification is "it compiles", or it exists only to make the list look thorough. Merge it upward.

**Right-sized** - you can name the files, name the test, and finish it before losing context.

## Parallelising across agents

Two slices may run concurrently only when **all** hold:

- Their file sets are disjoint (check with the plan's per-file listing, not by hope).
- Neither depends on the other's output shape (no shared new interface being defined by both).
- Both can be verified independently.

Otherwise sequence them. Merge conflicts between your own agents are a self-inflicted cost, and a shared type being invented twice is worse than a serialized wait.

When parallelising: give each agent its explicit file scope, tell each not to touch anything outside it, and re-run the full gate after both land - each agent only proved its own slice.

## Handling discoveries mid-flight

You will find things. Route them:

| Discovery | Action |
| --- | --- |
| Blocks the current slice | Fix inside the slice; note it in the report |
| Related but not blocking | New tracker item, link it, keep going |
| Reveals the design is wrong | Stop. Return to the plan. Do not patch around a broken design |
| Unrelated bug | Tracker item. Do not fix it in this diff |
| Tempting refactor | Tracker item. Refactor and behaviour change never share a commit |

## Ordering heuristics

1. Riskiest assumption first.
2. Then data and contracts (they are what other slices depend on).
3. Then the behaviour.
4. Then the surface (UI, CLI, docs).
5. Cleanup and flag removal last, as its own slice.

## Checklist

- [ ] Every acceptance criterion in the spec maps to at least one slice.
- [ ] Every slice leaves the repo green.
- [ ] Every task names its verification.
- [ ] Dependencies between slices are explicit; parallel-safe ones are marked.
- [ ] The riskiest slice is first.
- [ ] Nothing user-visible ships half-built without a flag.
