---
description: Review the current diff for correctness, silent failures, security and test gaps
argument-hint: "[diff target: empty for working tree, a branch, a commit range, or a PR number]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Task"]
---

# Review the change

**Target:** $ARGUMENTS (empty = uncommitted changes plus commits on this branch versus the default branch)

Follow `code-review-standards`.

1. **Establish the diff.** Determine the base and print a file-level summary (`git diff --stat`). If the diff is empty, say so and stop.
2. **Run the `code-reviewer` agent** over it.
3. **Run the `security-auditor` agent in addition** when the diff touches any of: authentication, authorization, user input parsing, file handling, outbound HTTP, secrets or configuration, payments, personal data, or database migrations. When in doubt, run it - the cost is one agent, the alternative is a breach.
4. **Merge the findings**, de-duplicate, and rank: blockers, then majors, then minors, then at most three nits.
5. **Verify each finding before reporting it.** Open the cited lines. If the failure scenario does not hold when you read the surrounding code, drop the finding rather than passing it on - a false finding costs the user more than a missed nit.
6. **Report** with the severity-ranked list, each finding carrying `file:line`, a concrete failure scenario, and a suggested fix. Then list what you checked and found clean.

Do not fix anything in this command unless the user asks. Review and repair are separate steps so the user keeps the decision.

**Gate:** no unaddressed blockers or majors before `/sdlc:ship`.
