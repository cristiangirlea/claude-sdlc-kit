# claude-sdlc-kit

A reusable, project-agnostic Claude Code kit for running a real software development lifecycle: **spec -> plan -> implement -> review -> verify -> ship -> learn**, with a gate between every stage and an issue tracker that works today with no service to sign up for.

Two plugins, 11 agents, 15 skills, 16 commands, 3 safety hooks. No dependencies beyond Node.js 18+ (and only the hooks and the local tracker need that).

## Why

Ad-hoc AI-assisted development produces plausible code fast, and then loses the things that make software maintainable: what "done" meant, why a decision was made, whether a test ever failed, what a change could break. This kit encodes those as artefacts and gates, so they survive the session that produced them.

Three rules run through everything here:

1. **Nothing is claimed that was not observed.** A gate is green because it was run, not because it should pass.
2. **A test that was never seen failing is not evidence.**
3. **Process scales with reversibility, not with ticket size.** A one-liner needs no ceremony; a schema change needs all of it.

## Quick start

**As a plugin** (one canonical copy, updates without a per-repo pull):

```
/plugin marketplace add <owner>/claude-sdlc-kit
/plugin install sdlc@sdlc-kit
/plugin install tracker@sdlc-kit
```

**Vendored into a project** (files committed to the repo, editable in place):

```bash
./scripts/install.sh /path/to/repo --templates
```

```powershell
.\scripts\install.ps1 -Target C:\src\my-repo -Templates
```

Then, in the target repo:

```
/sdlc:onboard          # writes a CLAUDE.md whose commands it actually ran
/tracker:setup local   # work items as files, no service needed
```

Full instructions and a staged team rollout: [docs/ADOPTION.md](docs/ADOPTION.md).
A worked example of one feature going through the whole loop: [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md).

## The loop

| Stage | Command | Owner | Gate before moving on |
| --- | --- | --- | --- |
| Intake | `/tracker:pick` | - | The work has an id |
| Spec | `/sdlc:spec` | `spec-analyst` | Acceptance criteria are testable; non-goals written |
| Plan | `/sdlc:plan` | `solution-architect` | Every criterion maps to a slice; every task names its verification |
| Implement | `/sdlc:implement` | `test-author`, `task-implementer` | Test observed failing first; repo green |
| Review | `/sdlc:review` | `code-reviewer`, `security-auditor` | No unaddressed blockers or majors |
| Verify | `/sdlc:verify` | `qa-verifier` | Definition of done passes |
| Ship | `/sdlc:ship` | `docs-scribe`, `release-manager` | Docs true; PR states what was verified |
| Learn | - | - | The lesson is written where it will be read |

Also: `/sdlc:bugfix` (reproduce -> red test -> root cause -> minimal fix), `/sdlc:adr`, `/sdlc:status`, `/sdlc:onboard`.

## What is in the box

### `sdlc` plugin

**Agents** - `spec-analyst`, `codebase-explorer`, `solution-architect`, `test-author`, `task-implementer`, `code-reviewer`, `security-auditor`, `debugger`, `qa-verifier`, `docs-scribe`, `release-manager`. Each has least-privilege tools: the reviewers cannot write, the test author cannot touch production code.

**Skills** - `sdlc-workflow` (the hub), `spec-writing`, `task-decomposition`, `tdd-workflow`, `testing-strategy`, `code-review-standards`, `git-workflow`, `adr-writing`, `secure-coding`, `definition-of-done`, `incident-response`, `repo-onboarding`, `release-management`. They load when relevant, and they double as the team's written standards.

**Hooks** - deny destructive shell commands (`rm -rf`, `push --force`, `reset --hard`, bare `git stash`, piped installers, `DROP TABLE`), deny writes to `.env` and key material, and print branch/work-item orientation at session start. All exit 0 in every case, so a hook bug can never block your work.

### `tracker` plugin

One command surface (`/tracker:pick|start|sync|comment|report`), two backends:

- **`local`** - one markdown file per work item under `docs/tracker/`, driven by a zero-dependency Node CLI. Diffs, reviews, needs no service. **Works today.**
- **`jira`** - the same commands against Jira Cloud. Fully documented (REST calls, JQL cookbook, ADF payloads, field and state mapping, failure modes) with a five-phase rollout plan. **Designed and documented, not yet exercised against a live instance** - the plan's first phases exist precisely to discover an instance's real shape rather than trust the example values.

### Templates

`CLAUDE.md`, `.claude/settings.json` (permission allow/deny plus hook wiring), PR template, CI quality-gates workflow, spec/ADR/tracker doc scaffolding.

## Layout

```
.claude-plugin/marketplace.json    both plugins, installable from this repo
plugins/sdlc/                      agents, skills, commands, hooks
plugins/tracker/                   tracker commands, skills, local backend CLI
templates/                         CLAUDE.md, settings.json, PR + CI templates, docs scaffolding
docs/                              adoption, walkthrough, authoring rules
scripts/install.sh|.ps1            vendored install
scripts/validate-kit.mjs           structural validation (run before committing)
```

## Extending it

Read [docs/AUTHORING.md](docs/AUTHORING.md): when to reach for a skill versus an agent versus a command versus a hook, the frontmatter contract for each, and the writing rules that keep these files as prompts rather than essays.

```bash
node scripts/validate-kit.mjs
```

Checks frontmatter, name/filename agreement, missing `references/` files, hook scripts that do not exist, and manifest consistency.

## Status

The workflow, agents, skills, commands, hooks, installers, local tracker and validator are implemented and exercised. The Jira backend is a documented design with a phased rollout - the commands and mappings are written, but nothing in this repo has talked to a live Jira instance.

## License

MIT - see [LICENSE](LICENSE).
