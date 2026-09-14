---
name: "release-management"
description: "How to cut a release - deriving the version bump from the actual diff, writing a changelog people can read, sequencing migrations with expand/contract, and preparing a rollout with a rollback plan and post-deploy checks. Use when tagging or publishing a release, writing release notes or a changelog, or planning how a change reaches production safely."
---

<!-- Generated from src/skills/release-management/SKILL.md by scripts/build.mjs. Edit the source, not this file. -->

# Release management

A release is a **decision**, and it needs the same rigour as a code change: what is in it, what could break, how it is undone.

## Version from the diff, not from the commit messages

Read the actual changes. Commit messages lie by omission - a `fix:` commit can remove a response field.

SemVer, for anything with consumers:

- **major** - a consumer must change something: removed or renamed field, changed default, stricter validation, changed error semantics, removed config key, altered CLI flags.
- **minor** - new capability, backwards compatible.
- **patch** - fix or internal change, no contract movement.

Pre-1.0, minor carries breaking changes - say so loudly in the notes rather than hiding behind the convention.

For an application with no external consumers, date- or build-based versions are fine; the changelog still matters.

## Changelog

Keep a Changelog format unless the project already has another. Write for a user of the software.

```markdown
## [1.4.0] - 2026-08-27

### Added
- Saved searches: store a filter set and re-run it from the dashboard.

### Changed
- Match scores now weight recency; existing scores are recomputed on first read.

### Fixed
- Duplicate matches when two filters overlapped (PROJ-455).

### Security
- Ownership check added to the search-export endpoint.

### Breaking
- `GET /api/matches` no longer returns `legacyScore`. Use `score`.
  Migration: <what a consumer must do>
```

Rules: user-facing framing, one line per change, tracker ids for traceability, and a **Breaking** section that tells the reader what to do - not just what happened. Internal refactors do not belong in a user changelog.

## Migrations: expand, migrate, contract

Never deploy a schema change and the code that requires it in the same irreversible step.

1. **Expand** - add the new column/table/field, nullable or defaulted. Deploy. Old code still works.
2. **Backfill** - chunked, resumable, rate-limited, cancellable. Verify counts before and after.
3. **Migrate** - deploy code that writes both and reads new. Watch.
4. **Contract** - once nothing reads the old shape, remove it. A separate release, days later, never the same one.

This sequence is what makes a rollback possible at every step. Compressing it is what makes an outage unrecoverable.

## Rollout

- Prefer a flag: dark launch, then a small cohort, then everyone. The flag is the fastest rollback there is.
- Know the **signal** that would make you roll back, and watch it deliberately for a defined window: error rate, latency, the feature's own success metric, queue depth.
- Announce the window. Do not ship a risky release into a weekend or an unstaffed hour.

## Rollback plan

Written before the deploy, not during the incident. It must answer:

- The exact command or steps to revert.
- What is **not** reverted by that command - data already written, messages already consumed, emails already sent.
- Whether the migration can be reversed, and if not, what the forward-fix path is.
- Who can execute it, and how it is verified afterwards.

If the honest answer is "we cannot roll this back", that is a decision requiring an ADR and a human's explicit approval - not a footnote.

## Post-deploy checks

Within the first minutes: error rate versus baseline, latency at p95/p99, the specific new code path exercised once for real, logs for new error signatures, and the metric the feature was meant to move.

## Never automate

Tagging, publishing, deploying to production, and executing migrations are human-run steps. Prepare the artefacts, write the exact commands, and hand them over.
