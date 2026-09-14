# Changelog

All notable changes to this kit are recorded here, in [Keep a Changelog](https://keepachangelog.com/) form.

## [Unreleased]

## [0.2.1] - 2026-09-14

- Fixed invalid agent YAML; source and generated frontmatter now use a strictly validated YAML-compatible subset with JSON-quoted values.
- Fixed builds in paths containing spaces and preserved unrelated `.agents` configuration during regeneration.
- Shared the Bash/PowerShell installer implementation, installed Codex skills in `.agents/skills`, and corrected tracker resource paths and project-root handling.
- Replaced the git guard's whitespace-splitting loop with a Node scanner of NUL-delimited staged paths and index blobs. Expanded credential and `.env` patterns.
- Covered common destructive-command flag variants, fixed tracker help exit codes, and included license notices in installed bundles.
- Added cross-platform behavioral CI and release-validation notes. Corrected claims about role permissions and current Codex features.

Jira remains an unverified design. Local hooks remain limited, bypassable checks.

## [0.2.0] - 2026-09-11

Restructured so one copy of the content ships to more than one agent.

### Added

- **Codex adapter.** The same skills, procedures and roles rendered for Codex: skills keep the identical `SKILL.md` contract, procedures become `<plugin>-<name>` skills (the adapter's chosen procedure surface), and roles become `references/agents/*.md` to run as a separate `codex exec` pass (portable reference roles; native Codex subagents are also available).
- **`templates/git-hooks/pre-commit`** - refuses commits carrying `.env` files, private keys, credential files, high-confidence credential patterns, or conflict markers. Tool-agnostic by design: it binds humans and every agent, which is the right home for a rule this absolute. Exercised against eight commit scenarios.
- **`scripts/build.mjs`** - renders `adapters/<tool>/` from `src/`, with `--check` to fail when they have drifted.
- **`AGENTS.md`** as the project-memory template, with `CLAUDE.md` reduced to a one-line pointer at it - one file of memory, read by every tool.
- **CI** (`.github/workflows/validate.yml`) running the validator, installer syntax and hook syntax.
- **`src/manifest.json`** - declares which skills, roles, procedures and scripts ship in which plugin. Content claimed by no plugin is now an error rather than a silent omission.

### Changed

- **Layout.** `src/` is the single source of truth; `plugins/` is gone. `adapters/claude/` and `adapters/codex/` are generated and committed so installing still needs no build step.
- **Tool-specific text is now tokens** (`{{CMD:...}}`, `{{AGENT:...}}`, `{{MEMORY}}`, `{{ARGS}}`, `{{PLUGIN_ROOT}}`, `{{SETTINGS}}`, `{{TOOL}}`) plus `<!-- if:claude -->` / `<!-- if:codex -->` blocks, so the two adapters cannot drift into contradicting each other.
- **`validate-kit.mjs`** now checks the source, manifest coverage, both generated adapters, unknown tokens, unbalanced conditionals, and finally that the adapters match `src/`.
- **Installers** take `--tool claude|codex`, and seed `AGENTS.md`, the `CLAUDE.md` pointer and the git hook.

### Fixed

- The pre-commit guard's private-key pattern begins with a dash and was being parsed by `grep` as an option; it now passes patterns with `-e`.

### Known limitations

- The Codex adapter's format was derived from an installed Codex build's on-disk plugin layout, not from documentation, and has not been loaded by a live Codex install.
- The Jira backend still has not been run against a live instance.

## [0.1.0] - 2026-08-28

First working version.

### Added

- **`sdlc` plugin** - the development loop as commands and gates.
  - 11 agents: `spec-analyst`, `codebase-explorer`, `solution-architect`, `test-author`, `task-implementer`, `code-reviewer`, `security-auditor`, `debugger`, `qa-verifier`, `docs-scribe`, `release-manager`, each with least-privilege tools.
  - 13 skills: `sdlc-workflow`, `spec-writing`, `task-decomposition`, `tdd-workflow`, `testing-strategy`, `code-review-standards`, `git-workflow`, `adr-writing`, `secure-coding`, `definition-of-done`, `incident-response`, `repo-onboarding`, `release-management`.
  - 10 commands: `/sdlc:spec`, `plan`, `implement`, `bugfix`, `review`, `verify`, `ship`, `adr`, `onboard`, `status`.
  - 3 hooks: dangerous-command guard, sensitive-file guard, session orientation. All exit 0 unconditionally.
- **`tracker` plugin** - tracker-agnostic issue workflow.
  - Local file backend (`scripts/tracker.mjs`) with `list`, `show`, `new`, `move`, `set`, `comment`, `report`, `next`.
  - 6 commands: `/tracker:setup`, `pick`, `start`, `sync`, `comment`, `report`.
  - Jira adapter documented: REST v3 calls, JQL cookbook, ADF payloads, state and field mapping, five-phase rollout plan, failure modes.
- **Templates** - `CLAUDE.md`, `.claude/settings.json` with permission allow/deny and hook wiring, PR template, CI quality-gates workflow, spec/ADR/tracker doc scaffolding.
- **Installers** - `scripts/install.sh` and `scripts/install.ps1`, both idempotent, with `--dry-run` and `--force`.
- **Validator** - `scripts/validate-kit.mjs`: frontmatter, name/filename agreement, missing references, hook script existence, manifest consistency.
- **Docs** - adoption guide with a staged team rollout, an end-to-end walkthrough, and authoring rules for extending the kit.

### Known limitations

- The Jira backend has not been run against a live instance. Transition ids, custom field ids and required fields are instance-specific and must be discovered per the phased plan.
- Hooks require Node.js 18+. Without it, the workflow still works; the guardrails do not.
