<!-- Title: <type>(<scope>): <what changed> [<TRACKER-ID>] -->

## What

<One paragraph, framed for someone using the software rather than writing it.>

## Why

<Link the spec and the tracker item. State the problem being solved.>

- Spec: `docs/specs/SPEC-<id>-<slug>.md`
- Item: <TRACKER-ID>

## How

<The approach, and any trade-off a reviewer should not have to reverse-engineer
from the diff. Link the ADR if a decision was recorded.>

## Verification

<The exact commands run and their observed result. Screenshots for UI changes.
Write this from output you saw, never from expectation.>

```
$ <command>
<result>
```

- [ ] Build / type-check
- [ ] Lint
- [ ] Tests (new tests were observed failing before the change)
- [ ] Exercised the feature for real at least once

## Risk and rollback

- Blast radius:
- Behind a flag: yes / no - <name>
- Migration: none / reversible / **irreversible (needs sign-off)**
- To undo: <exact steps>
- Signal that we should undo it: <metric or symptom>

## Notes for the reviewer

<Where to start. Anything deliberately left out, with its tracker id.>
