---
name: tdd-workflow
description: The red-green-refactor discipline this kit implements - write the failing test, observe it fail for the right reason, write the minimum code to pass, then refactor under a green suite. Use when implementing a slice, fixing a bug, or any time you are about to write production code, and when deciding whether a test is real evidence or theatre.
---

<!-- Generated from src/skills/tdd-workflow/SKILL.md by scripts/build.mjs. Edit the source, not this file. -->

# TDD loop

The point is not ceremony. It is that **a test you never watched fail is not evidence of anything** - it may assert nothing, test the wrong object, or pass because the framework silently skipped it.

## The loop

### Red

1. Pick one acceptance criterion or one bug case. One.
2. Write the smallest test that encodes it. Real inputs, explicit expected output.
3. **Run it.** It must fail, and the failure message must name the missing behaviour.
   - Fails with an import/compile error? That is a scaffolding error, not a red test. Add the stub with a `not implemented` body and re-run until the failure is behavioural.
   - Passes immediately? Either the behaviour already exists (then this is a characterization test - keep it and move on) or the test asserts nothing. Find out which before continuing.
4. Record the failure message. It is the proof that the next step actually did something.

### Green

5. Write the **minimum** production code that makes it pass. Not the general solution - the specific one. Generality arrives when the third case demands it, not before.
6. Run the single test: green. Run the file's suite: green. Run the project suite: green.
7. If getting to green required changing the test, stop and say so out loud - that is either a bad test or a changed requirement, and both need a decision.

### Refactor

8. Now, with a green suite, improve the code: naming, duplication, extraction, dead branches.
9. Refactor production code and test code separately, and re-run between them.
10. No new behaviour in the refactor step. If you add a capability, you are back at Red.

Then repeat for the next criterion.

## When to relax it

TDD is the default, not a religion. It is the wrong tool when:

- You are **exploring** - spiking to learn whether an approach works. Spike freely, then throw the spike away and re-implement test-first. Do not promote a spike to production code by adding tests afterwards and hoping.
- The output is **inherently visual or subjective** (layout, styling). Test the logic beneath it; check the visual by looking.
- You are writing a **thin, well-typed adapter** with no logic. A test that asserts a mock was called adds cost and no signal; cover it in the integration test instead.

Everywhere else - business logic, parsing, permissions, money, state machines, anything with an edge case - test first.

## Bug fixes are always test-first

1. Reproduce the bug.
2. Write the test that fails **because of the bug**, with the real inputs from the report.
3. Fix.
4. The test goes green; the rest of the suite stays green.

A bug fixed without a regression test is a bug scheduled to return.

## What a good test looks like

- Named for the behaviour: `rejects_expired_token`, not `test_auth_3`.
- One behaviour asserted; arrange/act/assert visible at a glance.
- Deterministic: fixed clock, seeded randomness, no sleeps, no live network, no dependence on test ordering.
- Asserts on observable outcomes (return value, persisted state, emitted event, status code) rather than on internal call counts.
- Fails with a message that tells you what broke without opening the test file.

## Traps

| Trap | Why it is a problem |
| --- | --- |
| Mocking the subject under test | Tests the mock, not the code |
| Asserting call counts on collaborators | Breaks on refactor, catches no defect |
| One giant test per feature | First failure hides the rest |
| Tests written after green "for coverage" | Never observed failing; may assert nothing |
| `try/except: pass` inside a test | Hides the failure you were testing for |
| Snapshot everything | Updates get rubber-stamped; the assertion dies |
| Sleeps for timing | Flake, and slow |

## Loop checklist

- [ ] Test written before the production code.
- [ ] Failure observed, and it named the missing behaviour.
- [ ] Minimum code written to pass.
- [ ] Whole suite green after the change.
- [ ] Refactor done under green, with no behaviour added.
- [ ] No test weakened to fit the implementation.
