---
description: Turn an approved spec into a design and an ordered list of verifiable slices
argument-hint: "[spec path or id; defaults to the newest spec]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit", "Task", "WebFetch"]
---

# Plan the work

**Spec:** $ARGUMENTS (if empty, use the most recently modified file in `docs/specs/`)

Follow `task-decomposition`; the design work belongs to the `solution-architect` agent.

1. **Read the spec.** If it has unanswered open questions with no recommended default, ask the user now - do not plan around a hole.
2. **Understand the ground.** If the affected code is unfamiliar, run the `codebase-explorer` agent over the relevant paths first and feed its map into the planning step.
3. **Run the `solution-architect` agent** with the spec plus the exploration map. It returns: chosen design, rejected alternatives, file-level changes, ordered slices, test strategy, rollout, ADR candidates.
4. **Check the plan yourself** before showing it:
   - Every acceptance criterion maps to at least one slice.
   - Every task names its verification.
   - Every slice leaves the repo green.
   - Slices that can run in parallel have disjoint file sets.
   - The riskiest slice is first.
5. **Append the plan** to the spec file under `## Plan`, or write `docs/plans/PLAN-<id>.md` if the project keeps them separate.
6. **Raise the ADR candidates** with the user explicitly. Anything hard to reverse gets `/sdlc:adr` before implementation starts, not after.
7. **Report** the slice list with sizes and the open decisions.

Stop here. Implementation begins on the user's word, not automatically.
