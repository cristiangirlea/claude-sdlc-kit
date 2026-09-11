---
description: Adopt this kit in the current repository - discover commands, write CLAUDE.md, set permissions and hooks
argument-hint: "[optional: area to focus on]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit", "Task"]
---

# Onboard this repository

**Focus:** $ARGUMENTS (default: the whole repo)

Follow `repo-onboarding`. The output is a `CLAUDE.md` and a `.claude/settings.json` that are **true**, because you ran everything in them.

1. **Survey.** Identify languages, frameworks, package managers, services, and the deployment shape. Read `Makefile`, `package.json`, `justfile`, `go.mod`, `pyproject.toml`, `docker-compose.yml`, `.env.example`, and the CI workflow files. CI is the definition of green.
2. **Map one path.** Run the `codebase-explorer` agent over one representative request or job, end to end, so `CLAUDE.md` can state the layering rule accurately.
3. **Extract conventions from recent code**, not from the style guide: read the three most recently changed non-trivial files and note error handling, validation placement, naming, and module boundaries.
4. **Verify the commands.** Actually run build, lint, type-check and the test suite. Record what works, what is slow, and what needs a service running. An unverified command in `CLAUDE.md` is worse than no command.
5. **Write `CLAUDE.md`** from this kit's `templates/CLAUDE.md`: what the project is, verified commands, layout, non-obvious conventions, constraints, gotchas. One page. If a `CLAUDE.md` already exists, correct it rather than replacing it, and delete lines that are no longer true.
6. **Write `.claude/settings.json`** from this kit's `templates/settings.json`: allow the routine read-only commands, deny the dangerous ones, wire the hooks. Start restrictive.
7. **Create the artefact layout:** `docs/specs/`, `docs/adr/`, `docs/runbooks/`, each with a one-line README, seeded from this kit's templates.
8. **Report** what you verified, what you assumed, and what you could not run (and why). Ask the user to confirm the conventions you inferred before they harden into project memory.
