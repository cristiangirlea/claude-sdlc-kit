# `sdlc` plugin

The development loop: **intake -> spec -> plan -> implement -> review -> verify -> ship -> learn**, with a gate between each stage.

<!-- if:claude -->
## Commands

| Command | What it does |
<!-- endif -->
<!-- if:codex -->
## Procedures

Each of these is a skill: describe the step you want and it fires.

| Skill | What it does |
<!-- endif -->
| --- | --- |
| `{{CMD:sdlc:spec}}` | Turn a request or ticket into a spec with testable acceptance criteria |
| `{{CMD:sdlc:plan}}` | Turn the spec into a design and ordered, verifiable slices |
| `{{CMD:sdlc:implement}}` | Build one slice test-first, leaving the repo green |
| `{{CMD:sdlc:bugfix}}` | Reproduce -> red test -> root cause -> minimal fix |
| `{{CMD:sdlc:review}}` | Correctness, silent-failure, security and test-gap review of the diff |
| `{{CMD:sdlc:verify}}` | Run the project's gates and the definition-of-done checklist |
| `{{CMD:sdlc:ship}}` | Docs, atomic commits, PR body, tracker update |
| `{{CMD:sdlc:adr}}` | Record an architecture decision |
| `{{CMD:sdlc:onboard}}` | Adopt the kit in a repo: verified `{{MEMORY}}`, settings, docs layout |
| `{{CMD:sdlc:status}}` | Where the work stands and what the next action is |

<!-- if:claude -->
## Agents

Dispatched into their own context window, each with least-privilege tools.

| Agent | Role | Writes? |
<!-- endif -->
<!-- if:codex -->
## Roles

Codex has no subagent dispatch, so these live in `references/agents/`. Run one
as its own `codex exec` pass when a clean context matters; otherwise adopt its
rules inline. The "writes" column is a rule to follow, not a gate that is
enforced for you.

| Role | Job | Writes? |
<!-- endif -->
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

<!-- if:claude -->
| Hook | Event | Behaviour |
| --- | --- | --- |
| `guard-dangerous-bash.mjs` | PreToolUse(Bash) | Denies `rm -rf`, `git push --force`, `reset --hard`, `git stash`, piped installers, `DROP TABLE`, bulk resource deletion. Override per repo with `.sdlc/allow-dangerous.txt` |
| `protect-sensitive-files.mjs` | PreToolUse(Write/Edit) | Denies writes to `.env`, private keys, credential files |
| `session-context.mjs` | SessionStart | Prints branch, derived work item, spec/plan status |

All three exit 0 in every case; a bug in a hook can never block your work.

The kit also ships `templates/git-hooks/pre-commit`, which refuses commits
carrying secrets or key material. Install it as well: it binds humans and other
tools, not just this session.
<!-- endif -->
<!-- if:codex -->
Codex has no per-tool-call hook, so enforcement lives in two places that do not
depend on which agent is running:

| Layer | Covers |
| --- | --- |
| `~/.codex/config.toml` | Sandbox mode and approval policy - what may run and what needs a human |
| `templates/git-hooks/pre-commit` | Refuses commits carrying `.env` files, private keys, credential files, or conflict markers |

Install the git hook: `git config core.hooksPath .githooks`. Being a git hook,
it binds every agent and every human - which is the right home for a rule this
absolute.
<!-- endif -->

## Requirements

Node.js 18+ for the tracker CLI and (on Claude Code) the hooks. The workflow
itself needs nothing.
