---
name: sdlc-workflow
description: The end-to-end development loop this kit enforces - intake, spec, plan, implement, review, verify, ship, learn - including which stage gate must pass before the next stage starts, which agent owns each stage, and where the artefacts live. Use when starting any non-trivial piece of work, when you are unsure which stage you are in or what to do next, when a request arrives with no ticket or spec, or when deciding whether something is ready to merge or ship.
---

# SDLC workflow

The loop. Every stage has an **owner**, an **artefact**, and a **gate** that must hold before the next stage begins. Skipping a stage is allowed; skipping its gate is not.

```
intake -> spec -> plan -> implement -> review -> verify -> ship -> learn
```

## Choose the path first

| Situation | Path |
| --- | --- |
| Typo, comment, config nudge, obvious one-liner | implement -> verify -> ship |
| Bug with a known reproduction | spec (short) -> failing test -> fix -> review -> verify -> ship |
| Feature, refactor, migration, anything cross-layer | full loop |
| Production incident | `incident-response` skill first; the loop resumes at the postmortem |
| "Just explore / is this possible" | spec's `Open questions` only, no implementation |

Do not run the full ceremony on a one-line change; do not skip the spec on a change that alters a contract. When in doubt, ask: *if this is wrong, how expensive is it to undo?* Expensive to undo means more process, not less.

## Stages

### 1. Intake
**Owner:** main thread. **Artefact:** a tracker item. **Gate:** the work has an id, a one-line goal, and a stated size.

Every piece of work gets an id before code is written - see the `tracker` plugin (`/tracker:pick`, `/tracker:start`). No id means no traceability from commit to reason.

### 2. Spec
**Owner:** `spec-analyst`. **Artefact:** `docs/specs/SPEC-<id>-<slug>.md`. **Gate:** every acceptance criterion is testable, non-goals are written, open questions have recommended defaults.

Run `/sdlc:spec`. See the `spec-writing` skill.

### 3. Plan
**Owner:** `solution-architect` (with `codebase-explorer` when the code is unfamiliar). **Artefact:** a plan section in the spec or `docs/plans/`. **Gate:** every acceptance criterion maps to at least one task; every task names its verification; slices leave the repo green.

Run `/sdlc:plan`. See `task-decomposition`. Hard-to-reverse decisions become ADRs - see `adr-writing`.

### 4. Implement
**Owner:** `test-author` then `task-implementer`. **Artefact:** the diff. **Gate:** new behaviour has a test that was observed failing first; the repo is green.

Run `/sdlc:implement`. See `tdd-workflow`. One slice at a time; parallel agents only for slices with disjoint file scopes.

### 5. Review
**Owner:** `code-reviewer`, plus `security-auditor` when the change touches auth, user input, secrets, outbound requests, money or migrations. **Artefact:** findings. **Gate:** no unaddressed blockers or majors.

Run `/sdlc:review`. See `code-review-standards`.

### 6. Verify
**Owner:** `qa-verifier`. **Artefact:** the gate table. **Gate:** the `definition-of-done` checklist passes.

Run `/sdlc:verify`. Green means observed green, not assumed.

### 7. Ship
**Owner:** main thread, with `docs-scribe` and `release-manager`. **Artefact:** commits, PR, changelog. **Gate:** docs match the change; the PR states what was verified; the tracker item is updated.

Run `/sdlc:ship`. See `git-workflow` and `release-management`.

### 8. Learn
**Owner:** main thread. **Artefact:** an updated `CLAUDE.md`, a new ADR, or a tightened checklist.

If a review or an incident found something a rule would have prevented, write the rule down where it will be read next time. This is the only stage that makes the next loop cheaper.

## Non-negotiables

1. **No behaviour without a test that was seen failing.** A test written after a passing implementation proves nothing about the test.
2. **Never report a gate green without running it.** "Should pass" is not a result.
3. **The tracker item, the branch, the commits and the PR share one id.**
4. **Scope is frozen at plan approval.** Anything discovered mid-implementation goes on the tracker as a new item; it does not silently join the diff.
5. **A change that cannot be rolled back needs an explicit decision from a human**, recorded in an ADR.
6. **Secrets, destructive commands and force-pushes are never automated.** Prepare them; let a person run them.

## Artefact layout

```
docs/
  specs/SPEC-<id>-<slug>.md      spec + plan for one unit of work
  adr/ADR-<n>-<slug>.md          decisions that outlive the code
  runbooks/<service>.md          how to operate and recover it
  tracker/                       local tracker items (tracker plugin)
CLAUDE.md                        the conventions an agent must know
```

## Command map

| Stage | Command | Agent |
| --- | --- | --- |
| Spec | `/sdlc:spec` | `spec-analyst` |
| Plan | `/sdlc:plan` | `solution-architect`, `codebase-explorer` |
| Implement | `/sdlc:implement` | `test-author`, `task-implementer` |
| Fix a bug | `/sdlc:bugfix` | `debugger`, `test-author` |
| Review | `/sdlc:review` | `code-reviewer`, `security-auditor` |
| Verify | `/sdlc:verify` | `qa-verifier` |
| Ship | `/sdlc:ship` | `docs-scribe`, `release-manager` |
| Record a decision | `/sdlc:adr` | - |
| Adopt the kit in a repo | `/sdlc:onboard` | `codebase-explorer` |
| Where am I | `/sdlc:status` | - |
