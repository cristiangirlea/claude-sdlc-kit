# claude-sdlc-kit

A reusable, project-agnostic kit for running a real software development lifecycle with a coding agent: **spec -> plan -> implement -> review -> verify -> ship -> learn**, with a gate between every stage and an issue tracker that works today with no service to sign up for.

Written once in `src/`, shipped to **Claude Code** and **Codex** as generated adapters. 15 skills, 11 roles, 16 procedures, guardrails at both the session and the git layer. Runtime scripts use only the Node.js standard library. Use Node.js 22+, Git, and Bash (Git Bash on Windows) for the optional git guard; the Windows installer uses PowerShell.

**Experimental community kit.** Review its prompts and settings before adopting it. It is not affiliated with Anthropic or OpenAI.

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

Install from the CLI, then start a fresh Codex session:

```bash
codex plugin marketplace add cristiangirlea/claude-sdlc-kit
codex plugin add sdlc@sdlc-kit
codex plugin add tracker@sdlc-kit
```

Or clone the repository and vendor the files:

```bash
./scripts/install.sh /path/to/repo --tool codex --templates
```

Then ask for the `sdlc-onboard` skill, and `tracker-setup`.

### Vendored (either tool)

First clone the kit and enter its directory:

```bash
git clone https://github.com/cristiangirlea/claude-sdlc-kit.git
cd claude-sdlc-kit
```

The target directory must already exist. Then run either installer:

```bash
./scripts/install.sh /path/to/repo --tool claude --templates
```

```powershell
.\scripts\install.ps1 -Target C:\src\my-repo -Tool claude -Templates
```

Files land in the target repo; review and commit them so the team gets them with a pull. Codex discovers the installed skills under `.agents/skills/`; Claude uses `.claude/`. `--dry-run` previews; existing files are skipped unless `--force`. New installations record per-file versions and hashes. Use `--upgrade --dry-run` to preview updates; `--upgrade` updates untouched files and preserves local edits. Conflicts return exit code 2. See [upgrade and conflict handling](docs/ADOPTION.md#upgrading-vendored-installations). Run vendored Claude tracker commands from the project root. The tracker CLI also accepts `--root "<project directory>"`.

Full instructions and a staged team rollout: [docs/ADOPTION.md](docs/ADOPTION.md).
A worked example of one feature going through the loop: [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md).
A runnable feature with recorded red/green evidence: [label normalizer](examples/label-normalizer/README.md). Run `node scripts/demo-workflow.mjs --tool codex` (or `claude`) to replay it in a temporary project.

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

**Roles (11)** - `spec-analyst`, `codebase-explorer`, `solution-architect`, `test-author`, `task-implementer`, `code-reviewer`, `security-auditor`, `debugger`, `qa-verifier`, `docs-scribe`, `release-manager`. On Claude Code they have scoped tool lists and written role boundaries. Bash can still write files, and the test-only rule is an instruction, not filesystem enforcement. The Codex adapter ships portable reference roles; use them inline or in an authorized native subagent/separate pass. Configure sandbox permissions separately.

**Tracker** - one procedure surface, two backends. **Local**: one markdown file per work item under `docs/tracker/`, driven by a zero-dependency Node CLI. Works today. **Jira**: the same procedures against Jira Cloud - REST calls, JQL cookbook, ADF payloads, field and state mapping, failure modes, and a five-phase rollout. Documented, **not yet run against a live instance**.

**Guardrails** - Claude hooks detect selected destructive shell commands and sensitive file writes. These are limited heuristics and fail open on internal errors. The optional git guard checks staged filenames and content for selected credentials, private keys, and conflict markers, including filenames with spaces. Install both files from `templates/git-hooks/` and activate them with `git config core.hooksPath .githooks`. Local hooks can be disabled or bypassed; use sandbox permissions and server-side checks for enforcement. This release does not configure Codex-native hooks.

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
node --test scripts/test-kit.mjs
```

Edit `src/`, never `adapters/`. [docs/AUTHORING.md](docs/AUTHORING.md) covers when to reach for a skill versus a role versus a procedure versus a hook, the frontmatter contract for each, the build tokens, and the writing rules that keep these files as prompts rather than essays.

## Status

| Piece | State |
| --- | --- |
| Skills, roles, procedures, templates, docs | Written and validated |
| Claude Code adapter | Generated with strict YAML-compatible metadata; client checks recorded in [release validation](docs/RELEASE_VALIDATION.md) |
| Codex adapter | Generated plugin manifests and documented `.agents/skills` vendoring; client checks recorded in [release validation](docs/RELEASE_VALIDATION.md) |
| Local tracker CLI | Exercised end to end, including error paths |
| Git pre-commit guard | Regression tests cover staged content, spaced/Unicode filenames, removed working copies, credentials, and actual rejected commits |
| Claude Code hooks | Command variants tested as inert payloads; no destructive commands executed |
| Jira backend | Documented design with a phased rollout; **never run against a live instance** |

## License

MIT - see [LICENSE](LICENSE). Bundled plugins and vendored installations retain the notice.

Contributions: [CONTRIBUTING.md](CONTRIBUTING.md). Security reports and guard limitations: [SECURITY.md](SECURITY.md).
