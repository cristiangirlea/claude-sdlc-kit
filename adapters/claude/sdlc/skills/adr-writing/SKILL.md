---
name: adr-writing
description: When a decision deserves an Architecture Decision Record and how to write one - context, options with real trade-offs, the decision, consequences including the bad ones, and how to supersede an ADR later. Use when a choice is hard to reverse (schema, dependency, public contract, auth model, data location, deployment shape), when someone asks why the system is built this way, or when reversing a previous decision.
---

<!-- Generated from src/skills/adr-writing/SKILL.md by scripts/build.mjs. Edit the source, not this file. -->

# Architecture Decision Records

An ADR captures **why**, at the moment the reasons were still known. Code shows what was built; git shows when; only an ADR shows what the alternatives were and which constraints made them lose.

Template: `references/adr-template.md`. Store as `docs/adr/ADR-<nnnn>-<slug>.md`, numbered sequentially, never renumbered.

## Write one when the decision is expensive to reverse

Yes:
- Data model or storage engine choice; where data lives (which service owns which table)
- A new runtime dependency, framework, or third-party service
- Public API or event contract shape; versioning strategy
- Authentication and authorization model; tenancy model
- Sync vs async boundaries; consistency guarantees; retry/idempotency semantics
- Deployment topology; anything with a compliance or data-residency dimension
- Deliberately accepting a known limitation or a temporary hack with a cost

No:
- Naming, formatting, file layout - conventions belong in `CLAUDE.md`
- Anything a single PR could undo in an afternoon
- Restating a framework's default that nobody debated

Test: *if someone deletes this in a year, will they ask "why on earth was it done this way?"* If yes, write the ADR.

## Structure

**Title** - the decision as a statement: "ADR-0007: Store saved searches as normalized rows, not JSON blobs".

**Status** - `proposed` -> `accepted` -> (`superseded by ADR-00xx` | `deprecated`). Never delete an ADR; supersede it. The wrong turns are part of the record.

**Context** - the forces at the time: requirements, constraints, existing system, deadline, team size, what you did not know. Write it so a stranger understands the pressure without asking you. No solution here.

**Options considered** - at least two, each with honest pros and cons. An ADR with one option is an announcement, not a decision. Include the option you nearly picked and say what tipped it.

**Decision** - what was chosen, stated plainly and in the active voice: "We will ...".

**Consequences** - the part that gets skipped and matters most. Both directions:
- What becomes easier.
- What becomes harder or is now foreclosed.
- What must be built or paid for as a result (migration, monitoring, extra tests).
- The conditions under which this decision should be revisited.

**References** - spec, ticket, benchmark, prototype, prior art.

## Quality bar

- Written at the time of the decision, not reconstructed six months later.
- Short: one to two pages. Nobody reads a ten-page ADR, so nobody learns from it.
- Concrete about trade-offs - "simpler" and "more scalable" are not trade-offs; "one extra join per read, in exchange for being able to filter by tag without a table scan" is.
- Honest about what was unknown.
- Dated, and attributed.

## Superseding

When reality changes, write a new ADR that references the old one and set the old one's status to `superseded by ADR-00xx`. In the new one, state what changed - new load, new requirement, a cost that turned out differently - because that is the lesson. Editing the old ADR to look correct destroys the record.
