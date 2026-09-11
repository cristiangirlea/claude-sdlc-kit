---
description: Record an architecture decision - context, options, decision, consequences
argument-hint: "[the decision, or the question to be decided]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit"]
---

# Record the decision

**Decision:** $ARGUMENTS

Follow `adr-writing`.

1. **Check it deserves an ADR.** Hard to reverse - schema, dependency, public contract, auth or tenancy model, where data lives, sync/async boundary, deliberate accepted limitation? If a single PR could undo it in an afternoon, put it in `CLAUDE.md` instead and say so.
2. **Find the next number.** List `docs/adr/`; take the highest and add one. Never reuse or renumber.
3. **Write the context** from what is actually true now: requirements, constraints, what is unknown. No solution in this section.
4. **Write at least two real options**, each with honest pros and cons - including the one you nearly chose, and "do nothing". A single-option ADR is an announcement, not a decision.
5. **State the decision** in the active voice, naming the constraint that decided it.
6. **Write the consequences**, both directions: what gets easier, what gets harder or is now foreclosed, what work this creates, and the condition that should make someone revisit it.
7. **Save** as `docs/adr/ADR-<nnnn>-<slug>.md` with status `proposed`, then show it to the user for acceptance. Only a human moves it to `accepted`.

**Superseding an existing ADR:** write a new one that references the old, set the old one's status to `superseded by ADR-<nnnn>`, and explain in the new one what changed in the world. Never edit an old ADR to look right - the wrong turns are the valuable part of the record.
