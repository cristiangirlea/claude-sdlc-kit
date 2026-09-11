# claude-sdlc-kit

A reusable, project-agnostic kit for running a real software development lifecycle with a coding agent: **spec -> plan -> implement -> review -> verify -> ship -> learn**, with a gate between every stage and an issue tracker that works today with no service to sign up for.

Written once in `src/`, shipped to **Claude Code** and **Codex** as generated adapters. 15 skills, 11 roles, 16 procedures, guardrails at both the session and the git layer. No dependencies beyond Node.js 18+.

## Why

Ad-hoc AI-assisted development produces plausible code fast, then loses the things that make software maintainable: what "done" meant, why a decision was made, whether a test ever failed, what a change could break. This kit encodes those as artefacts and gates that outlive the session that produced them.

Three rules run through everything here:

1. **Nothing is claimed that was not observed.** A gate is green because it was run, not because it should pass.
2. **A test that was never seen failing is not evidence.**
3. **Process scales with reversibility, not with ticket size.** A one-liner needs no ceremony; a schema change needs all of it.

## Quick start

### Claude Code

```
/plugin marketplace add cristiangirlea/claude-sdlc-kit
```

```
/plugin install sdlc@sdlc-kit
```

```
/plugin install tracker@sdlc-kit
```

Then `/sdlc:onboard` to ground it in the project, and `/tracker:setup local`.

### Codex

Add this repo as a marketplace and install the same two plugins, or vendor the files:

```bash
./scripts/install.sh /path/to/repo --tool codex --templates
```

Then ask for the `sdlc-onboard` skill, and `tracker-setup`.

### Vendored (either tool)

```bash
./scripts/install.sh /path/to/repo --tool claude --templates
```

```powershell
.\scripts\install.ps1 -Target C:\src\my-repo -Tool claude -Templates
```

Files land in the target repo and are committed there, so the team gets them with a pull. `--dry-run` previews; existing files are skipped unless `--force`.

Full instructions and a staged team rollout: [docs/ADOPTION.md](docs/ADOPTION.md).
A worked example of one feature going through the loop: [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md).

## The loop

| Stage | Claude Code | Codex | Gate before moving on |
| --- | --- | --- | --- |
| Intake | `/tracker:pick` | `tracker-pick` | The work has an id |
| Spec | `/sdlc:spec` | `sdlc-spec` | Acceptance criteria are testable; non-goals written |
| Plan | `/sdlc:plan` | `sdlc-plan` | Every criterion maps to a slice; every task names its verification |
| Implement | `/sdlc:implement` | `sdlc-implement` | Test observed failing first; repo green |
| Review | `/sdlc:review` | `sdlc-review` | No unaddressed blockers or majors |
| Verify | `/sdlc:verify` | `sdlc-verify` | Definition of done passes |
| Ship | `/sdlc:ship` | `sdlc-ship` | Docs true; PR states what was verified |
| Learn | - | - | The lesson is written where it will be read |

Also: `bugfix` (reproduce -> red test -> root cause -> minimal fix), `adr`, `status`, `onboard`.

## What is in the box

**Skills (15)** - `sdlc-workflow` (the hub), `spec-writing`, `task-decomposition`, `tdd-workflow`, `testing-strategy`, `code-review-standards`, `git-workflow`, `adr-writing`, `secure-coding`, `definition-of-done`, `incident-response`, `repo-onboarding`, `release-management`, plus `tracker-workflow` and `jira-integration`. They load when relevant and double as the team's written standards.

**Roles (11)** - `spec-analyst`, `codebase-explorer`, `solution-architect`, `test-author`, `task-implementer`, `code-reviewer`, `security-auditor`, `debugger`, `qa-verifier`, `docs-scribe`, `release-manager`. On Claude Code they are subagents with least-privilege tools - the reviewers cannot write, the test author cannot touch production code. On Codex they are reference roles you run as a separate `codex exec` pass.

**Tracker** - one procedure surface, two backends. **Local**: one markdown file per work item under `docs/tracker/`, driven by a zero-dependency Node CLI. Works today. **Jira**: the same procedures against Jira Cloud - REST calls, JQL cookbook, ADF payloads, field and state mapping, failure modes, and a five-phase rollout. Documented, **not yet run against a live instance**.

**Guardrails** - on Claude Code, hooks that deny destructive shell commands (`rm -rf`, `push --force`, `reset --hard`, bare `git stash`, piped installers, `DROP TABLE`) and writes to `.env` and key material, all exiting 0 so a hook bug can never block you. On any tool, `templates/git-hooks/pre-commit` refuses commits carrying secrets, private keys or conflict markers - it binds humans too, which is why it is the layer that matters most.

**Templates** - `AGENTS.md` project memory (with a `CLAUDE.md` pointer so there is one file, not two), permissions/settings, PR template, CI quality gates, spec/ADR/tracker scaffolding.

## Layout

```
src/                      the single source of truth
  skills/ agents/ commands/ hooks/ scripts/ manifest.json
adapters/claude/          GENERATED - do not edit
adapters/codex/           GENERATED - do not edit
.claude-plugin/           Claude marketplace manifest (generated)
.agents/plugins/          Codex marketplace manifest (generated)
templates/                files copied into a target project
docs/                     adoption, walkthrough, authoring rules
scripts/                  build.mjs, validate-kit.mjs, install.sh, install.ps1
```

Adapters are generated **and committed**, so installing needs no build step - and `validate-kit.mjs` fails if they have drifted from `src/`.

## Extending it

```bash
node scripts/build.mjs && node scripts/validate-kit.mjs
```

Edit `src/`, never `adapters/`. [docs/AUTHORING.md](docs/AUTHORING.md) covers when to reach for a skill versus a role versus a procedure versus a hook, the frontmatter contract for each, the build tokens, and the writing rules that keep these files as prompts rather than essays.

## Status

| Piece | State |
| --- | --- |
| Skills, roles, procedures, templates, docs | Written and validated |
| Claude Code adapter | Generated; format matches Claude Code's plugin layout |
| Codex adapter | Generated; format derived from an installed Codex build's on-disk layout, **not yet loaded by a live Codex install** |
| Local tracker CLI | Exercised end to end, including error paths |
| Git pre-commit guard | Exercised against eight commit scenarios |
| Claude Code hooks | Exercised against thirteen sample payloads |
| Jira backend | Documented design with a phased rollout; **never run against a live instance** |

## License

MIT - see [LICENSE](LICENSE).
