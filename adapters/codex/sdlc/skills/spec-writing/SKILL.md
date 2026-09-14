---
name: "spec-writing"
description: "How to write a specification that is small enough to read and precise enough to build from - scope, non-goals, Given/When/Then acceptance criteria, edge-case enumeration, and open questions with recommended defaults. Use when turning a request or ticket into a spec, when reviewing someone else's spec, or when a request is too vague to implement safely."
---

<!-- Generated from src/skills/spec-writing/SKILL.md by scripts/build.mjs. Edit the source, not this file. -->

# Writing a spec

A spec answers one question: **what does correct mean here?** Not how to build it (that is the plan) and not why the product wants it (that is the ticket).

Template: `references/spec-template.md`. Save specs as `docs/specs/SPEC-<id>-<slug>.md`.

## Size it to the risk

- **One paragraph** for a bug: current behaviour, expected behaviour, reproduction.
- **One page** for a normal feature.
- **Several pages** only when the change is hard to reverse: schema, public API, auth model, money, data migration.

If the spec takes longer to write than the change takes to build *and* the change is easy to undo, write less.

## The parts that earn their place

**Summary** - one paragraph a stakeholder could read. If you cannot write it, you do not understand the request yet.

**Context / current behaviour** - what happens today, with file references. This is what makes the diff reviewable later.

**Goals** - the outcomes, not the implementation. "Users can re-run a saved search" is a goal; "add a `saved_searches` table" is not.

**Non-goals** - the highest-value section. Write down what a reasonable person might assume is included and is not. This is what stops the change doubling in size on day three.

**Behaviour** - the happy path as a numbered sequence, then the edge cases. Enumerate deliberately:

- empty / none / zero results
- one, many, and far too many
- duplicates and collisions
- invalid, malformed, hostile input
- unauthenticated, authenticated-but-unauthorized, wrong tenant
- concurrent execution, double submit, retry, partial failure
- external dependency slow, down, or returning garbage
- what happens on rollback or replay

**Acceptance criteria** - the contract. One line each, numbered, in Given/When/Then form:

> AC3 - Given a saved search owned by user A, When user B requests it by id, Then the API returns 404 and no row is read into the response.

Rules: testable by observation; no implementation nouns unless the implementation *is* the requirement; every edge case that matters has one; a reviewer can decide done/not-done from the list alone.

**Non-functional requirements** - only the ones that bind: latency or throughput budget with a number, authz model, data retention and privacy, observability (what must be logged or measured), and limits.

**Data / migration impact** - new or changed tables and fields, backfill needs, whether the migration is reversible.

**Rollout and rollback** - flagged or not, who sees it first, how it is turned off, what tells you to turn it off.

**Open questions** - each with a recommended default so work is never blocked by an unanswered question; it proceeds under a stated assumption that a human can override.

## Anti-patterns

| Anti-pattern | Why it hurts | Fix |
| --- | --- | --- |
| Design in the spec | Freezes an implementation before trade-offs are examined | Move it to the plan |
| Untestable criteria ("intuitive", "fast") | Nobody can say when it is done | Put a number or an observation on it |
| No non-goals | Scope grows silently | List three things you are not doing |
| Invented requirements | Builds the wrong thing confidently | Move them to open questions |
| Happy path only | Edge cases get invented during coding | Walk the enumeration list above |
| Restating the ticket | Adds ceremony, no information | Link the ticket; write only what it does not say |

## Definition of ready

The spec is ready to plan against when:

- [ ] Summary, goals and non-goals are written.
- [ ] Every acceptance criterion is observable and numbered.
- [ ] Edge cases and failure modes are enumerated, not implied.
- [ ] Data, security and rollback impact are stated (even if "none").
- [ ] Open questions each carry a recommended default.
- [ ] A person other than the author could build from it.
