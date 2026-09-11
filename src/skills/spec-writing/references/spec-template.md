# SPEC-<id>: <title>

- **Status:** draft | ready | in progress | done | superseded
- **Tracker:** <PROJ-123 or local id>
- **Author:** <name>
- **Last updated:** <YYYY-MM-DD>

## Summary

<One paragraph. What changes for a user of this system, and why now.>

## Context and current behaviour

<What happens today. Cite files: `path/to/file.ext:line`.>

## Goals

- G1 - <outcome>

## Non-goals

- <explicitly not doing this, and why>

## Actors and triggers

| Actor | Trigger | Outcome |
| --- | --- | --- |

## Behaviour

### Happy path

1. <step>

### Edge cases and failure modes

| Case | Expected behaviour |
| --- | --- |
| Empty result set | |
| Unauthorized actor | |
| Duplicate / concurrent request | |
| Dependency unavailable | |
| Partial failure mid-operation | |

## Acceptance criteria

- **AC1** - Given <state>, When <action>, Then <observable outcome>.
- **AC2** - ...

## Non-functional requirements

- **Performance:** <budget with a number>
- **Security / authz:** <who may do this, enforced where>
- **Privacy:** <data touched, retention, what must not be logged>
- **Observability:** <logs, metrics, traces required>
- **Limits:** <rate limits, sizes, quotas>

## Data and migration impact

- Schema changes:
- Backfill required:
- Reversible:

## Rollout and rollback

- Flag / gradual rollout:
- How to disable:
- Signal that it must be disabled:

## Open questions

- **Q1** - <question> (recommended default: <answer>)

## References

- Tracker: <link>
- Related specs / ADRs:
- Prior art in this repo: `path:line`
