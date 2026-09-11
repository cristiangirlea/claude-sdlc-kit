<!--
  AGENTS.md template - project memory, read by Claude Code (via the CLAUDE.md
  pointer beside this file), Codex, and any other agent that honours the
  AGENTS.md convention.

  This file is loaded into every agent session in this repo, so it is
  expensive context. Rules for keeping it worth its cost:

    1. Every command in here must have been RUN and observed to work.
    2. Say only what the code does not already say.
    3. Delete lines the moment they stop being true - a stale line here sends
       the next session confidently wrong.
    4. Aim for one page. If it grows past two, move detail into a skill or a
       doc and link it.

  Replace every <angle-bracket> placeholder and delete this comment.
-->

# <Project name>

<Two sentences: what this is, and who uses it.>

## Commands

| Task | Command |
| --- | --- |
| Install deps | `<cmd>` |
| Run locally | `<cmd>` |
| Build | `<cmd>` |
| Test (all) | `<cmd>` |
| Test (one) | `<cmd -run TestName / -k test_name>` |
| Lint | `<cmd>` |
| Format | `<cmd>` |
| Type-check | `<cmd>` |
| Migrations | `<cmd>` |

<CI is the definition of green; these must match what CI runs.>

## Layout

```
<dir>/    <one line: what lives here>
<dir>/    <one line>
```

## Conventions

<Only the ones that are not obvious from reading the code. Examples of the kind
of thing that belongs here:>

- Handlers never touch the database directly; they go through `<store>`.
- Errors are wrapped with context at each layer; only the top layer logs.
- Validation happens at the boundary, in `<place>` - not in business logic.
- New public endpoints require an authorization check in `<place>`.
- <Naming rule that a newcomer would get wrong.>

## Constraints

- <Never do X.> <Why.>
- New dependencies need an ADR (`docs/adr/`).
- Migrations must be reversible; expand/contract, never a destructive step.
- <Anything that touches production data or costs money.>

## Gotchas

- <The thing that wastes a newcomer's first day.>
- <The test that needs a service running, and how to start it.>
- <The environment variable everyone forgets.>

## Workflow

This repo uses the SDLC kit. Specs live in `docs/specs/`, decisions in
`docs/adr/`, work items in `docs/tracker/` (or Jira - see
`.sdlc/tracker.json`).

- Claude Code: `/sdlc:status` shows where the work stands.
- Codex: the `sdlc-status` skill does the same.
