<!-- Generated from src/plugin-readme-sdlc.md by scripts/build.mjs. Edit the source, not this file. -->

# `sdlc` plugin

The development loop: **intake -> spec -> plan -> implement -> review -> verify -> ship -> learn**, with a gate between each stage.

## Procedures

Each of these is a skill: describe the step you want and it fires.

| Skill | What it does |
| --- | --- |
| `the `sdlc-spec` skill` | Turn a request or ticket into a spec with testable acceptance criteria |
| `the `sdlc-plan` skill` | Turn the spec into a design and ordered, verifiable slices |
| `the `sdlc-implement` skill` | Build one slice test-first, leaving the repo green |
| `the `sdlc-bugfix` skill` | Reproduce -> red test -> root cause -> minimal fix |
| `the `sdlc-review` skill` | Correctness, silent-failure, security and test-gap review of the diff |
| `the `sdlc-verify` skill` | Run the project's gates and the definition-of-done checklist |
| `the `sdlc-ship` skill` | Docs, atomic commits, PR body, tracker update |
| `the `sdlc-adr` skill` | Record an architecture decision |
| `the `sdlc-onboard` skill` | Adopt the kit in a repo: verified `AGENTS.md`, settings, docs layout |
| `the `sdlc-status` skill` | Where the work stands and what the next action is |

## Roles

This adapter keeps portable roles in `references/agents/`. Use a role in an authorized native subagent or separate pass when a clean context matters; otherwise adopt its rules inline. The "writes" column is a rule to follow, not a gate that is
enforced for you.

| Role | Job | Writes? |
| --- | --- | --- |
| `spec-analyst` | Requirements into a testable spec | no |
| `codebase-explorer` | Maps how existing code actually works | no |
| `solution-architect` | Design and ordered implementation plan | no |
| `test-author` | Failing tests first, coverage gaps | test files only |
| `task-implementer` | Executes one scoped slice | yes, in scope |
| `code-reviewer` | Severity-ranked findings with failure scenarios | no |
| `security-auditor` | Exploitable defects with attack paths | no |
| `debugger` | Root cause, mechanism, minimal fix | yes, minimal |
| `qa-verifier` | Runs the gates, returns signal not noise | no |
| `docs-scribe` | Repairs what the change invalidated | docs only |
| `release-manager` | Version, changelog, rollout and rollback | docs only |

## Skills

Loaded automatically when relevant; readable on their own as the team's written standards.

`sdlc-workflow` (the hub) - `spec-writing` - `task-decomposition` - `tdd-workflow` - `testing-strategy` - `code-review-standards` - `git-workflow` - `adr-writing` - `secure-coding` - `definition-of-done` - `incident-response` - `repo-onboarding` - `release-management`

## Guardrails

Codex supports native hooks, but this release does not install them. Configure the sandbox and optional git check separately:

| Layer | Covers |
| --- | --- |
| `~/.codex/config.toml` | Sandbox mode and approval policy - what may run and what needs a human |
| `templates/git-hooks/pre-commit` | Refuses commits carrying `.env` files, private keys, credential files, or conflict markers |

Copy both files from `templates/git-hooks/` into `.githooks/` and enable them with `git config core.hooksPath .githooks`. The local check can be bypassed; it does not replace sandbox or server-side enforcement.

## Requirements

Node.js 22+ for the tracker CLI and (on Claude Code) the hooks. The workflow
itself needs nothing.
