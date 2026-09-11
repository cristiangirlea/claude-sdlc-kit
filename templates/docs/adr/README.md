# Architecture decision records

One file per decision: `ADR-<nnnn>-<slug>.md`, numbered sequentially and never renumbered.

An ADR records **why**, while the reasons are still known: the context, the options that lost, the decision, and the consequences - including the bad ones.

- Create one with `/sdlc:adr`.
- Template and the standard it is held to: the `adr-writing` skill.
- Write one when the decision is expensive to reverse: schema, dependency, public contract, auth or tenancy model, where data lives, sync/async boundary, or a deliberately accepted limitation.
- Do not write one for naming, formatting or anything a single PR could undo in an afternoon - those are conventions, and they belong in `CLAUDE.md`.

**Never delete or rewrite an accepted ADR.** When reality changes, write a new one and set the old one's status to `superseded by ADR-<nnnn>`. The wrong turns are the part future readers learn from.
