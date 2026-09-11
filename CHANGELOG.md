# Changelog

All notable changes to this kit are recorded here, in [Keep a Changelog](https://keepachangelog.com/) form.

## [Unreleased]

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
