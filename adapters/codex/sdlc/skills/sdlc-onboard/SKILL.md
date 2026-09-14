---
name: "sdlc-onboard"
description: "Adopt this kit in the current repository - discover commands, write AGENTS.md, set permissions and hooks. Use when the user asks for the sdlc \"onboard\" step by name, or reaches that stage of the SDLC loop."
---

<!-- Generated from src/commands/sdlc/onboard.md by scripts/build.mjs. Edit the source, not this file. -->

# Onboard this repository

**Focus:** the user's request (default: the whole repo)

Follow `repo-onboarding`. The output is a `AGENTS.md` and a `~/.codex/config.toml` that are **true**, because you ran everything in them.

1. **Survey.** Identify languages, frameworks, package managers, services, and the deployment shape. Read `Makefile`, `package.json`, `justfile`, `go.mod`, `pyproject.toml`, `docker-compose.yml`, `.env.example`, and the CI workflow files. CI is the definition of green.
2. **Map one path.** Run the `codebase-explorer` role (../../references/agents/codebase-explorer.md, relative to this skill) over one representative request or job, end to end, so `AGENTS.md` can state the layering rule accurately.
3. **Extract conventions from recent code**, not from the style guide: read the three most recently changed non-trivial files and note error handling, validation placement, naming, and module boundaries.
4. **Verify the commands.** Actually run build, lint, type-check and the test suite. Record what works, what is slow, and what needs a service running. An unverified command in `AGENTS.md` is worse than no command.
5. **Write `AGENTS.md`** from this kit's `templates/AGENTS.md`: what the project is, verified commands, layout, non-obvious conventions, constraints, gotchas. One page. If a `AGENTS.md` already exists, correct it rather than replacing it, and delete lines that are no longer true.
6. **Set up the guardrails.**
   Check `~/.codex/config.toml` for sandbox mode and approval policy, and install `templates/git-hooks/pre-commit` so the secret-and-key rule binds every agent and every human.
7. **Create the artefact layout:** `docs/specs/`, `docs/adr/`, `docs/runbooks/`, each with a one-line README, seeded from this kit's templates.
8. **Report** what you verified, what you assumed, and what you could not run (and why). Ask the user to confirm the conventions you inferred before they harden into project memory.
