# Specs

One file per unit of work: `SPEC-<id>-<slug>.md`, where `<id>` is the tracker id.

A spec answers **what does correct mean here** - scope, behaviour, edge cases, and acceptance criteria a reviewer can decide "done or not done" from. It does not answer *how* (that is the `## Plan` section, added by `/sdlc:plan`) and it does not restate the ticket.

- Create one with `/sdlc:spec`.
- Template and the standard it is held to: the `spec-writing` skill.
- Keep the `Status` field current: `draft -> ready -> in progress -> done`.

A spec that is out of date is worse than no spec. When the implementation deliberately diverges, update the spec in the same PR - or delete the stale line.
