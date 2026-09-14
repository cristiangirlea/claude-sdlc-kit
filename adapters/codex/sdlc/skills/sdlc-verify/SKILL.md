---
name: "sdlc-verify"
description: "Run the project's quality gates and the definition-of-done checklist. Use when the user asks for the sdlc \"verify\" step by name, or reaches that stage of the SDLC loop."
---

<!-- Generated from src/commands/sdlc/verify.md by scripts/build.mjs. Edit the source, not this file. -->

# Verify

**Scope:** the user's request (default: all gates)

1. **Find the real commands.** Read `AGENTS.md`, `Makefile`, `package.json`, `justfile`, and the CI workflow. CI is the definition of green - if the README disagrees with CI, believe CI.
2. **Run the `qa-verifier` role (../../references/agents/qa-verifier.md, relative to this skill)** so the raw output stays out of this conversation and only the signal comes back: build, type-check, lint, unit tests, integration tests, coverage on changed files.
3. **Walk the `definition-of-done` checklist** against the change - tests, security, data, operability, docs, handover. Tick what holds; name what does not.
4. **Report:**
   - A gate table: gate, exact command, result.
   - Every failure with its test name, assertion and `file:line`.
   - Which failures are pre-existing on the base revision versus introduced here.
   - Which DoD items are not satisfied.

**The honesty rule:** report only results you observed. Never write "tests pass" for a command you did not run, and never present a skipped gate as a passed one. If a gate could not run (missing service, missing credential), say which and why.
