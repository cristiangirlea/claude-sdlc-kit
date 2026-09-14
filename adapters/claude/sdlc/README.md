<!-- Generated from src/plugin-readme-sdlc.md by scripts/build.mjs. Edit the source, not this file. -->

# `sdlc` plugin

The development loop: **intake -> spec -> plan -> implement -> review -> verify -> ship -> learn**, with a gate between each stage.

## Commands

| Command | What it does |
| --- | --- |
| `/sdlc:spec` | Turn a request or ticket into a spec with testable acceptance criteria |
| `/sdlc:plan` | Turn the spec into a design and ordered, verifiable slices |
| `/sdlc:implement` | Build one slice test-first, leaving the repo green |
| `/sdlc:bugfix` | Reproduce -> red test -> root cause -> minimal fix |
| `/sdlc:review` | Correctness, silent-failure, security and test-gap review of the diff |
| `/sdlc:verify` | Run the project's gates and the definition-of-done checklist |
| `/sdlc:ship` | Docs, atomic commits, PR body, tracker update |
| `/sdlc:adr` | Record an architecture decision |
| `/sdlc:onboard` | Adopt the kit in a repo: verified `CLAUDE.md`, settings, docs layout |
| `/sdlc:status` | Where the work stands and what the next action is |

## Agents

Dispatched into their own context window with scoped tool lists. The writes column describes role instructions; Bash access and unrestricted file tools are not path-level enforcement.

| Agent | Role | Writes? |
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

| Hook | Event | Behaviour |
| --- | --- | --- |
| `guard-dangerous-bash.mjs` | PreToolUse(Bash) | Denies `rm -rf`, `git push --force`, `reset --hard`, `git stash`, piped installers, `DROP TABLE`, bulk resource deletion. Override per repo with `.sdlc/allow-dangerous.txt` |
| `protect-sensitive-files.mjs` | PreToolUse(Write/Edit) | Denies writes to `.env`, private keys, credential files |
| `session-context.mjs` | SessionStart | Prints branch, derived work item, spec/plan status |

The scripts exit 0 and return denials in JSON. They fail open on internal errors; missing Node or a timeout can still produce a client hook error. These checks are not a complete security boundary.

The kit also ships a launcher and Node scanner in `templates/git-hooks/`. Once enabled, they check selected staged filename/content patterns for every normal git commit, including commits from other tools. Hooks can be bypassed.

## Requirements

Node.js 22+ for the tracker CLI and (on Claude Code) the hooks. The workflow
itself needs nothing.
