---
name: "testing-strategy"
description: "How to decide what kind of test to write and where - the unit/integration/e2e split, what deserves a test at all, fixture and test-data conventions, handling flakes, and what coverage does and does not tell you. Use when planning a slice's test strategy, when a test is hard to write, when tests are slow or flaky, or when reviewing whether a diff's tests are adequate."
---

# Testing strategy

## Pick the level by what could break

| Level | Answers | Use it for | Keep it |
| --- | --- | --- | --- |
| **Unit** | "Is this logic right?" | Pure logic, parsing, calculation, permission rules, state machines, edge cases | Milliseconds, no I/O, most of your tests |
| **Integration** | "Do these pieces agree?" | Handler + store + real DB, queue consumers, module contracts, migrations | Seconds, real dependencies where cheap (containers/temp DB) |
| **End-to-end** | "Does the user's path work?" | The few critical journeys: sign in, the core action, checkout | Minutes, very few, only for what would be a headline outage |
| **Contract** | "Are we and they still compatible?" | Third-party and cross-service boundaries | Pinned recorded fixtures, refreshed deliberately |

Rule of thumb: push a test **down** to the cheapest level that can still catch the defect. An edge case in a permission rule belongs in a unit test, not in an e2e run that takes four minutes to tell you the same thing.

## What deserves a test

**Always** - business rules and calculations; permission and ownership checks; anything touching money, time zones, or units; parsers and serializers; state transitions; error paths and retries; bug fixes; public contracts.

**Usually not** - generated code; framework glue with no branching; trivial getters; logging statements; layout and styling; a thin adapter with no logic (cover it once at the integration level).

If you cannot decide: ask what a defect here would cost. Silent wrong data costs the most, and it is exactly the class that unit tests catch cheaply.

## Test data

- **Builders over fixtures.** A `newUser(withEmail("a@b.c"))` helper beats a shared JSON blob that fifty tests depend on and nobody dares change.
- **Explicit over implicit.** State the values the assertion depends on inside the test. A test whose expected value comes from a distant fixture is unreadable.
- **Fresh state per test.** Transaction rollback, a temp database, or truncation between tests. Shared mutable state is how order-dependent flake starts.
- **Realistic, not real.** Never copy production data into tests: synthesise records with the same shape, including the awkward ones - unicode names, empty strings, huge values, nulls.

## Doubles

Use the lightest double that works: a real object > a fake (in-memory implementation) > a stub (canned answers) > a mock (asserts interactions).

Mock only at boundaries you own the contract for, and never mock the thing you are testing. If a test needs five mocks to run, that is a design signal - the code has too many collaborators.

## Flakes

A flaky test is worse than no test: it trains everyone to ignore red.

1. **Quarantine it the same day** (skip with a link to a tracker item) - do not let it erode trust in the suite.
2. **Find the cause**, and it is almost always one of: real time or sleeps; unseeded randomness; test-order dependence; shared external state; unawaited async work; network; resource limits under parallelism.
3. **Fix the cause, not the symptom.** Adding a retry to a flaky test hides a real race that your users will meet.

## Speed

Slow suites stop being run. Keep the inner loop (unit tests for the module you are in) under a few seconds. Parallelise integration tests with isolated data per worker. Move heavy suites to CI stages, but never let "CI will catch it" be the reason you did not run anything locally.

## Coverage

Coverage tells you what was **executed**, not what was **verified**. Use it as a search tool - "which new branches have no test?" - never as a target. A team optimising a coverage number writes assertions-free tests that execute code and prove nothing.

Practical rule: **new and changed lines in a diff should be covered**, and the uncovered ones should be a deliberate, stated choice.

## Review questions for a diff's tests

- [ ] Does each new behaviour have a test that would fail without the change?
- [ ] Are the error paths tested, not just the happy path?
- [ ] Is anything asserted on implementation detail that a refactor would break?
- [ ] Could any test pass while the feature is broken (over-mocked, empty assertions)?
- [ ] Is the test at the cheapest level that could catch the defect?
- [ ] Is the data deterministic - clock, randomness, ordering, parallelism?
