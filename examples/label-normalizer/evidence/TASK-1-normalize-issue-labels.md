---
# sdlc-tracker-format: json-strings-v1
id: "TASK-1"
title: "Normalize issue labels"
status: "done"
type: "feature"
priority: "P3"
assignee: ""
branch: ""
pr: ""
spec: "SPEC.md"
external: ""
created: "2026-09-15"
updated: "2026-09-15"
---


## Description

Normalize user-entered issue labels consistently without mutating caller input. See SPEC.md and PLAN.md.

## Acceptance criteria

- AC1: Trim, lowercase and deduplicate in first-occurrence order.
- AC2: Discard blanks; accept an empty list.
- AC3: Preserve the original array.
- AC4: Reject non-array inputs and non-string elements.

## Notes

## Log
- 2026-09-15 Exported completed spec and acceptance criteria with the final tracker metadata format. Kit validation: 46 passing regression cases.
- 2026-09-15 status in-review -> done
- 2026-09-15 Inline self-review completed. Red: 3 behavioral failures, 1 pass. Green: 4 passes, syntax pass. Tests unchanged. See REVIEW.md.
- 2026-09-15 status in-progress -> in-review
- 2026-09-15 status ready -> in-progress
- 2026-09-15 status backlog -> ready
- 2026-09-15 set spec=SPEC.md
- 2026-09-15 created (backlog)
