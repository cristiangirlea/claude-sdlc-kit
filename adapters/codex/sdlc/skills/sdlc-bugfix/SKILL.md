---
name: "sdlc-bugfix"
description: "Fix a bug the disciplined way - reproduce, red test, root cause, minimal fix. Use when the user asks for the sdlc \"bugfix\" step by name, or reaches that stage of the SDLC loop."
---

<!-- Generated from src/commands/sdlc/bugfix.md by scripts/build.mjs. Edit the source, not this file. -->

# Fix a bug

**Bug:** the user's request

The whole point of this command is to stop the "change something until it goes green" loop.

1. **Reproduce.** Get the exact command, input and environment that shows the failure. If you cannot reproduce it, that is the task - say so and go find the reproduction before touching code.
2. **Write the red test.** Run the `test-author` role (../../references/agents/test-author.md, relative to this skill) to encode the reported case as a test that fails **because of the bug**. Record the failure message.
3. **Find the cause.** Run the `debugger` role (../../references/agents/debugger.md, relative to this skill). Require a mechanism: which line, why it produces this symptom, and why it started now. A fix without an explanation is not accepted.
4. **Fix minimally.** Repair the cause, not the symptom. No refactoring in the same commit; no unrelated cleanup.
5. **Verify.** New test green, whole suite green (`the `sdlc-verify` skill`). Confirm the test fails again if you revert the fix - that is the proof the test is real.
6. **Look for siblings.** The same bug shape usually exists elsewhere (same copy-pasted block, same missing guard). Search for it and report what you find - fix it here only if it is the same slice, otherwise open tracker items.
7. **Report:** root cause, the fix, the regression test, and related risk.

If the bug was in production, use the `incident-response` skill for the stabilise/communicate steps first - the fix comes after the bleeding stops.
