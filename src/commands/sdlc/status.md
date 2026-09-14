---
description: "Show where this work stands in the SDLC loop and what the next action is"
allowed-tools: ["Read", "Grep", "Glob", "Bash"]
---

# Where are we

Repository state:

<!-- if:claude -->
- Branch: !`git branch --show-current`
- Working tree: !`git status --short`
- Commits ahead of the default branch: !`git log --oneline @{u}..HEAD 2>/dev/null || git log --oneline -8`
<!-- endif -->
<!-- if:codex -->
Run these and read the output before answering:

```bash
git branch --show-current
git status --short
git log --oneline @{u}..HEAD 2>/dev/null || git log --oneline -8
```
<!-- endif -->

Now assemble the picture and report it compactly:

1. **Work item** - derive the tracker id from the branch name; read the matching item under `docs/tracker/` if the tracker plugin is in use.
2. **Spec** - is there a `docs/specs/SPEC-<id>-*.md`? Status field?
3. **Plan** - does the spec have a `## Plan` section, and which slices are still unchecked?
4. **Diff** - files changed on this branch versus the default branch, as a one-line summary.
5. **Gates** - has `{{CMD:sdlc:verify}}` been run in this session, and what was the result? Do not re-run it here; report what is known and say if it is unknown.

Then state, in one line each:

- **Stage:** intake | spec | plan | implement | review | verify | ship
- **Blocking gate:** what must hold before the next stage
- **Next action:** the single command to run next

Keep it under fifteen lines. This command exists to re-orient quickly, not to produce a report.
