# A feature, end to end

One worked example of the whole loop, so the commands stop being abstract. The feature: **users can save a search and re-run it**.

Commands are written in Claude Code form (`/sdlc:spec`). On Codex the same procedures are skills with the same names minus the slash (`sdlc-spec`) - ask for the step and it fires.

Nothing here is magic - each step is a command, an agent, and a gate you can decide to skip. What you cannot skip is the gate's *question*.

---

## 1. Capture it

```
/tracker:pick Add saved searches
```

Creates `docs/tracker/TASK-42-add-saved-searches.md` in `backlog`. Thirty seconds, and now every commit, branch and PR that follows has something to point at.

## 2. Spec it

```
/sdlc:spec TASK-42
```

`spec-analyst` reads the request *and the code around it*, then writes `docs/specs/SPEC-TASK-42-add-saved-searches.md`.

What comes back that you did not ask for, and that is the point:

- **Non-goals** - "not sharing saved searches between users", "not scheduling them". Written down before anyone assumes otherwise.
- **Edge cases** - what happens when the underlying filter is deleted, when a user saves the same search twice, when 500 saved searches exist.
- **Open questions with defaults** - "Q1: does re-running a saved search use the filters as they were at save time, or as they are now? (recommended default: as saved, so results are reproducible)".

You answer Q1 with one line. That answer would otherwise have surfaced on day three as a rewrite.

**Gate:** every acceptance criterion is testable. `AC4 - Given user B is signed in, When they request user A's saved search by id, Then the API returns 404.` That is checkable. "Saved searches are secure" is not.

## 3. Plan it

```
/sdlc:plan
```

`solution-architect` returns a design, the alternatives it rejected (JSON blob versus normalized rows - and why), the file-level changes, and six slices:

| # | Slice | Verified by |
| --- | --- | --- |
| 1 | Schema + reversible migration | migration up/down test |
| 2 | Store layer with ownership scoping | store tests incl. cross-user denial |
| 3 | API endpoints behind a flag | handler tests 201/200/404/403 |
| 4 | Re-run against the existing query path | integration test vs live search |
| 5 | UI: save, list, re-run | component tests + one e2e |
| 6 | Flag removal, docs, changelog | full suite + smoke |

Note the ordering: the risky parts (schema, ownership) are proven before any UI exists. Note also the ADR candidate it flagged - *normalized rows vs JSON blob* is hard to reverse once data exists.

```
/sdlc:adr Store saved searches as normalized rows
```

## 4. Start

```
/tracker:start TASK-42
```

Branch `feat/TASK-42-saved-searches`, item moved to `in-progress`, branch recorded on the item. One id now runs through everything.

## 5. Build, slice by slice

```
/sdlc:implement 1
```

`test-author` writes the migration test **first** and reports it failing. `task-implementer` writes the migration until it passes. `/sdlc:verify` says green. Slice 1 is done and the repo is shippable.

Then slice 2. Halfway through it you notice the existing search endpoint has an N+1 query. It is not in scope:

```
/tracker:pick Fix N+1 in search endpoint
```

Captured, linked, not fixed. The diff stays reviewable.

Slices 3 and 4 touch different files - run them in parallel, then re-run the full gate, because each agent only proved its own slice.

## 6. Review

```
/sdlc:review
```

`code-reviewer` returns three findings; `security-auditor` runs too, because this touches authorization:

> **[Blocker]** `listSavedSearches` scopes by `userId` from the request body, not the session - `internal/httpapi/server.go:214`
> Attacker: any signed-in user. Path: POST with another user's id -> their saved searches are returned.
> Fix: take the id from the session; delete the body field.

That is the finding that justifies the entire process. It is also exactly the class of bug that a passing test suite does not catch, because the test used the same wrong assumption as the code.

## 7. Verify

```
/sdlc:verify
```

A gate table, not a wall of log output: build pass, lint pass, 247 tests pass, coverage on changed files 91%. Plus the definition-of-done walk: docs, `.env.example`, rollback, flag.

## 8. Ship

```
/sdlc:ship
```

`docs-scribe` updates the README's feature list, `.env.example` for the new flag, and the changelog. Commits are atomic and conventional. The PR body's **Verification** section contains the commands actually run and their output - so the reviewer is checking a claim, not a vibe.

Nothing is pushed until you say yes.

```
/tracker:sync
```

Item moves to `in-review`, PR linked.

## 9. Learn

The review caught an authorization bug that came from a pattern used in three other handlers. That is not a one-off:

- A line in `AGENTS.md`: *"Ownership is always derived from the session, never from a request field."*
- A checklist item already exists in `code-review-standards` - now it is also in the repo's own memory.
- A tracker item to fix the other three handlers.

The next loop is cheaper. That is the only reason this last stage exists.

---

## What this costs, honestly

A one-line change does not need any of this - `/sdlc:verify` and a commit is the whole workflow. The ceremony pays for itself when the change is **hard to undo**: schema, contracts, authorization, money, data migration. Match the process to the reversibility, not to the size of the ticket.
