---
name: "sdlc-spec"
description: "Turn a request or tracker item into a reviewable spec with testable acceptance criteria. Use when the user asks for the sdlc \"spec\" step by name, or reaches that stage of the SDLC loop."
---

<!-- Generated from src/commands/sdlc/spec.md by scripts/build.mjs. Edit the source, not this file. -->

# Write the spec

**Input:** the user's request

Follow the `spec-writing` skill. Produce a spec, not a design and not code.

1. **Gather the input.** If the argument is a tracker id, pull the item (`the `tracker-show` skill <id>`). If it is a path, read it. If it is prose, use it as-is.
2. **Ground it in the code.** Find the most similar existing feature and read it, so the spec matches how this repo actually works. Use the `codebase-explorer` role (../../references/agents/codebase-explorer.md, relative to this skill) if the area is unfamiliar.
3. **Run the `spec-analyst` role (../../references/agents/spec-analyst.md, relative to this skill)** with the request plus what you found. It returns the spec document.
4. **Save it** to `docs/specs/SPEC-<id>-<slug>.md` (create the directory if needed). Use the tracker id when there is one; otherwise the next free number.
5. **Report to the user**, in the terminal: the summary, the non-goals, the acceptance criteria, and - most importantly - the open questions with their recommended defaults.

Then stop and let the user react. Do not start planning or implementing in the same turn: the point of a spec gate is that a human sees the scope before code exists.

**Gate before moving on:** every acceptance criterion is observable and testable, non-goals are written, and each open question carries a recommended default.
