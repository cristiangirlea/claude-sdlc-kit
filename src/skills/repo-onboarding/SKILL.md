---
name: repo-onboarding
description: How to adopt this kit in an existing repository and write the project memory it depends on - discovering the real build/test/lint commands, capturing conventions into {{MEMORY}}, setting permissions and guardrails in {{SETTINGS}}, and creating the docs/ artefact layout. Use when starting work in an unfamiliar repository, when installing this kit into a project, or when {{MEMORY}} is missing, stale or bloated.
---

# Onboarding a repository

The kit is generic; a project is not. Onboarding is the step that grounds generic workflow in **this** repo's real commands and conventions. Run `{{CMD:sdlc:onboard}}` to do it interactively.

## 1. Discover, do not assume

Read, in this order, and record what you find:

| Question | Where the answer actually is |
| --- | --- |
| How is it built? | `Makefile`, `justfile`, `package.json` scripts, `go.mod`, `pyproject.toml`, `Dockerfile`, CI workflow |
| How are tests run? | CI workflow first - it is the definition of green - then local scripts |
| How is it linted/formatted? | Linter config files, pre-commit config, CI steps |
| How does it run locally? | `docker-compose.yml`, `.env.example`, README setup section |
| What are the layers? | Directory structure plus one traced request path |
| What conventions are in force? | The three most recently changed non-trivial files, not the style guide |
| What is dangerous here? | Migrations, deploy scripts, anything touching production data |

CI is the source of truth for the gate commands. A README that disagrees with CI is out of date.

## 2. Write {{MEMORY}}

`{{MEMORY}}` is loaded into every session in this repo. It is expensive context, so it must be **short, specific, and true**. Aim for one page.

Include, and nothing else:

- **What this project is** - two sentences.
- **Commands** - build, test, single-test, lint, format, run locally. Exact, copy-pasteable, verified by running them.
- **Layout** - the three or four directories that matter, one line each.
- **Conventions that are not obvious from the code** - error handling style, where validation lives, naming rules, layering rules ("handlers never touch the DB directly").
- **Constraints** - what must never happen (no direct writes to X, no new dependencies without an ADR, never run migrations against prod from a laptop).
- **Gotchas** - the things that waste a newcomer's first day.

Exclude: anything the code already says; a file-by-file inventory; general programming advice; anything you have not verified. Every stale line costs trust and tokens.

Template: `templates/AGENTS.md` in this kit. Claude Code reads `CLAUDE.md`, so `templates/CLAUDE.md` is a one-line pointer at `AGENTS.md` - one file of project memory, read by every tool.

## 3. Configure the guardrails

<!-- if:claude -->
Project-level `{{SETTINGS}}`, committed to the repo, so the whole team gets the same behaviour:

- **`permissions.allow`** - the read-only and routine commands you do not want to approve every time (`Bash(git status)`, `Bash(go test:*)`, `Bash(npm run test:*)`, `Read`, `Grep`).
- **`permissions.deny`** - the ones that should never happen unattended (`Bash(git push --force:*)`, `Bash(rm -rf:*)`, writes to `.env` and key material, production deploy scripts).
- **`hooks`** - the guardrails from this kit (see `templates/settings.json`): block dangerous Bash, deny writes to secrets, print branch and work-item context at session start.
<!-- endif -->
<!-- if:codex -->
Two layers, because Codex has no per-tool-call hook:

- **`{{SETTINGS}}`** - sandbox mode and approval policy. Keep writes confined to the workspace and approvals on for anything that leaves it.
- **`.git/hooks/pre-commit`** - install `templates/git-hooks/pre-commit` from this kit. It refuses commits that carry `.env` files, private keys or credential files. Being a git hook, it binds every agent and every human, which is the right place for a rule this absolute.
<!-- endif -->

Start restrictive. Loosen based on the prompts you actually hit, not on speculation.

## 4. Create the artefact layout

```
docs/specs/     docs/adr/     docs/runbooks/     docs/tracker/
```

Seed each with the templates from this kit and a one-line README so the directory's purpose survives its first empty week.

## 5. Prove it

Onboarding is done when you have **run** every command you wrote down and they behaved as documented. An unverified command in `{{MEMORY}}` is worse than no command - it sends the next session confidently wrong.

## Keeping it true

`{{MEMORY}}` rots faster than code. Update it when:
- a command changes (this is the most common and most damaging drift),
- a new convention is agreed in review,
- a repeated correction happens twice - the third time should be unnecessary,
- an incident reveals a constraint nobody wrote down.

Delete as eagerly as you add. If a line has not been true for a month, it is doing damage.
