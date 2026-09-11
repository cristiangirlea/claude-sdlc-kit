---
name: code-review-standards
description: What to look for in a diff and how to report it - the hunting order from correctness to convention, the blocker/major/minor severity rubric, the requirement that every finding carries a concrete failure scenario, and how to give and receive review feedback. Use when reviewing a diff or a PR, when triaging review findings, or when deciding whether a change is safe to merge.
---

# Code review standards

A review is not a vote of confidence; it is a search for the specific ways this diff will hurt. Two rules make it useful:

1. **Every finding names a failure scenario** - inputs or state, and the wrong outcome. If you cannot write that sentence, you have a preference, not a finding.
2. **Findings are ranked, worst first.** A data-loss bug must not be buried under naming suggestions.

The checklist for the human side of "is it done" lives in `definition-of-done`; deep security review lives in `secure-coding`.

## Hunting order

Work down this list. Stop expanding scope once the diff is covered - reviewing the whole repo is not a review.

### 1. Correctness
Off-by-one and boundary handling; inverted or short-circuited conditions; nil/null/empty/zero-value paths; integer and float precision (money must not be a float); time zones, DST and clock skew; encoding and locale; wrong variable used in a copy-pasted block.

### 2. Silent failure
Swallowed exceptions; bare `catch`/`except` without re-raise or log; ignored return values and error codes; defaults that mask a fault ("fall back to empty list" when the fetch failed); retries that treat permanent errors as transient; `console.log` in place of real error handling.

### 3. Security
New route without an authorization check; ownership checked on the client's claim rather than the session; string-built queries; secrets in code, logs or errors; user input reaching a shell, path, template or URL fetch; PII in telemetry. Escalate to `security-auditor` when the diff touches auth, input parsing, uploads, outbound requests, money or migrations.

### 4. Concurrency and state
Read-modify-write without atomicity or a lock; non-idempotent handler for an at-least-once delivery; shared mutable state across requests or goroutines/threads; cache invalidation that can serve a stale authorization decision.

### 5. Data and migrations
Destructive or irreversible migration; a backfill that locks a hot table; a schema change deployed in the same step as the code that requires it (expand/contract instead); missing index for a new query pattern that will table-scan in production.

### 6. Contracts
Response shape or field removed/renamed; default value changed; error code changed; a new required parameter; behaviour change without a flag, version, or deprecation path. Ask: what breaks in a client we do not control?

### 7. Tests
New behaviour with no assertion; tests that cannot fail; the subject under test mocked out; error paths untested; a weakened assertion in the same diff as the code it was guarding (a strong smell).

### 8. Operability
Will an on-call engineer be able to tell this failed, and why? New failure modes need a log with context, a metric, or an alert. Log levels sane, no secrets in logs, no unbounded log volume in a hot path.

### 9. Convention and clarity
Does it match the module it lives in - error style, layering, naming, module boundaries? Is there a comment explaining a *why* that is not obvious? Dead code, leftover TODO without an owner, commented-out blocks.

## Severity rubric

| Severity | Definition | Merge? |
| --- | --- | --- |
| **Blocker** | Data loss or corruption, security hole, breaks production for real users, irreversible migration with no plan | No |
| **Major** | Wrong for a realistic input; missing test on risky new behaviour; contract break with no plan; silent failure on an important path | No, unless explicitly accepted and tracked |
| **Minor** | Correct but fragile, unclear, or inconsistent with local convention | Yes, fix now or track |
| **Nit** | Genuinely optional taste | Yes, ignorable. Cap at three |

Out of scope entirely: formatting a linter should own; rewriting working code to your preferred style; architectural rewrites triggered by a small diff (open a tracker item instead).

## Writing a finding

```markdown
### [Major] `applyFilters` drops the last page when total is an exact multiple of pageSize - `internal/matching/matching.go:88`
Failure scenario: total=100, pageSize=25 -> the loop exits at offset 75 and page 4 is never fetched, so 25 matches are silently missing.
Fix: use `offset < total` rather than `offset + pageSize < total`.
```

Three parts, always: **claim with location**, **failure scenario**, **fix**. Suggest the fix; do not apply it unless asked.

## Reporting a clean review

Say so plainly and list what you checked. "No blocking findings. Verified: authz on both new routes, error paths on the fetcher, migration is reversible, tests cover the empty and duplicate cases." That is a useful review. Manufacturing findings to appear diligent wastes the author's time and devalues real findings.

## Responding to review

- Fix, or explain why not - in the thread, not silently.
- "Out of scope, tracked as X" is a complete answer.
- Disagreement is resolved by the failure scenario: if the reviewer cannot produce one, the finding drops; if they can, it stands.
- Never weaken a test to close a finding.
