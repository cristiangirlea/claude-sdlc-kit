# Runnable example: normalize issue labels

A small feature taken through intake, spec, plan, red tests, implementation,
self-review and verification in a Codex desktop agent session. The feature is
a pure function: trim and lowercase labels, discard blanks, deduplicate in order,
reject invalid inputs and preserve the caller's array.

From the kit repository root, using Node.js 22+:

```bash
node scripts/demo-workflow.mjs --tool codex
node scripts/demo-workflow.mjs --tool claude
```

Each replay installs that adapter into a new temporary project, creates a real
local tracker item, runs the same tests against the starter (three expected
behavioral failures), copies the completed implementation, verifies four passing
tests and syntax, and advances the example item to done. It removes only its own
temporary project. It needs no API key, model call, dependency install or live service.

Run only the completed feature's tests:

```bash
node --test examples/label-normalizer/label-normalizer.test.mjs
```

## Inspect the actual session

- [Specification](SPEC.md) maps four acceptance criteria to the tests.
- [Plan](PLAN.md) describes the single implementation slice.
- [Starter](starter.mjs) loads successfully but lacks the requested behavior.
- [Implementation](label-normalizer.mjs) and [tests](label-normalizer.test.mjs).
- [Self-review](REVIEW.md) states the checks and limits.
- [Recorded evidence](evidence/session.json), [red output](evidence/red.tap),
  [green output](evidence/green.txt), and [tracker history](evidence/TASK-1-normalize-issue-labels.md).

The recorded run was driven by the current Codex desktop agent with the kit's
instructions read and roles adopted inline. Local project paths in output are
replaced with `<project>` and trailing whitespace is removed. Timings and timestamps describe that run only.
The replay is deterministic and contains the solution; it is not a fresh
model-driven run or proof that every client follows the workflow independently.
