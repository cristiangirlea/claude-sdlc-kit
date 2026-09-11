---
name: sdlc-review
description: Review the current diff for correctness, silent failures, security and test gaps. Use when the user asks for the sdlc "review" step by name, or reaches that stage of the SDLC loop.
---

<!-- Generated from src/commands/sdlc/review.md by scripts/build.mjs. Edit the source, not this file. -->

# Review the change

**Target:** the user's request (empty = uncommitted changes plus commits on this branch versus the default branch)

Follow `code-review-standards`.

1. **Establish the diff.** Determine the base and print a file-level summary (`git diff --stat`). If the diff is empty, say so and stop.
2. **Run the `code-reviewer` role (references/agents/code-reviewer.md)** over it.
3. **Run the `security-auditor` role (references/agents/security-auditor.md) in addition** when the diff touches any of: authentication, authorization, user input parsing, file handling, outbound HTTP, secrets or configuration, payments, personal data, or database migrations. When in doubt, run it - the cost is one agent, the alternative is a breach.
4. **Merge the findings**, de-duplicate, and rank: blockers, then majors, then minors, then at most three nits.
5. **Verify each finding before reporting it.** Open the cited lines. If the failure scenario does not hold when you read the surrounding code, drop the finding rather than passing it on - a false finding costs the user more than a missed nit.
6. **Report** with the severity-ranked list, each finding carrying `file:line`, a concrete failure scenario, and a suggested fix. Then list what you checked and found clean.

Do not fix anything in this command unless the user asks. Review and repair are separate steps so the user keeps the decision.

**Gate:** no unaddressed blockers or majors before `the `sdlc-ship` skill`.
