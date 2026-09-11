---
name: definition-of-done
description: The gate that decides whether a piece of work is actually finished - code, tests, docs, security, operability, tracker and rollback - plus the rule that "done" means observed, not assumed. Use before claiming a task is complete, before opening a pull request, before merging, and when someone asks whether something is ready to ship.
---

<!-- Generated from src/skills/definition-of-done/SKILL.md by scripts/build.mjs. Edit the source, not this file. -->

# Definition of done

"Done" means: **a competent stranger could take this over, and nothing in it is a claim you have not observed.**

Run this as a gate, not as a formality. Anything unchecked is either fixed now or written down as an explicit, tracked exception.

## Gate 1 - The change itself

- [ ] Every acceptance criterion in the spec is satisfied, and you can point at where.
- [ ] Nothing outside the agreed scope is in the diff.
- [ ] No debug output, commented-out code, or dead branches left behind.
- [ ] No TODO without a tracker id.
- [ ] No new dependency added without a stated reason (and an ADR if it is hard to remove).
- [ ] The code matches the conventions of the module it lives in.

## Gate 2 - Tests

- [ ] New behaviour has tests that were observed failing before the implementation.
- [ ] Error and edge paths are covered, not just the happy path.
- [ ] No existing assertion was weakened to make the change pass.
- [ ] The full suite passes locally - **observed**, with the output in hand.
- [ ] No new flake introduced (no sleeps, live network, or order dependence).

## Gate 3 - Verification

- [ ] Build / compile: pass.
- [ ] Lint / vet / format: pass.
- [ ] Type-check: pass.
- [ ] Tests: pass.
- [ ] The feature was exercised for real at least once (request, click-through, CLI run) - not only through tests.

State the commands and their results. "Should be fine" is not a verification.

## Gate 4 - Security and data

- [ ] New paths enforce authentication and authorization.
- [ ] No secrets in code, config, logs or fixtures.
- [ ] User input is validated at the boundary; no injection sink is reachable.
- [ ] No PII added to logs or telemetry.
- [ ] Migrations are reversible, or the irreversibility is a recorded decision.
- [ ] Schema and code can be deployed independently (expand/contract).

## Gate 5 - Operability

- [ ] A failure in this code is visible to whoever is on call - log with context, metric, or alert.
- [ ] No unbounded logging or unbounded query in a hot path.
- [ ] New configuration and flags are documented with safe defaults.
- [ ] There is a way to turn it off, and a signal that would tell you to.

## Gate 6 - Documentation

- [ ] README / setup steps updated if they changed.
- [ ] `.env.example` (or equivalent) covers every new variable.
- [ ] API docs match the implemented contract.
- [ ] Changelog entry written if the change is user-visible.
- [ ] `CLAUDE.md` updated if a new convention or command was introduced.
- [ ] An ADR exists for every hard-to-reverse decision made along the way.

## Gate 7 - Handover

- [ ] Commits are atomic, conventional, and each builds.
- [ ] The PR body states what was verified, with the actual commands.
- [ ] The tracker item is updated and links to the PR.
- [ ] Anything deliberately left out is listed - in the PR and in the tracker.

## The honesty rule

If any gate did not pass, say so explicitly and say why. Partial completion reported accurately is useful; completion claimed without evidence poisons every future report. Scaling the work down is the user's decision to make, not yours - deliver what you have, name the gap.
