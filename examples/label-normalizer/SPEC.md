# TASK-1: Normalize issue labels

Users entering labels with different casing or surrounding whitespace should
get one consistent list without changing the input they supplied.

## Acceptance criteria

- AC1: `[' Bug ', 'bug', 'URGENT', 'docs']` produces `['bug', 'urgent', 'docs']`,
  retaining the first occurrence's order after trimming and lowercasing.
- AC2: Empty and whitespace-only labels are discarded; an empty input stays empty.
- AC3: The original array is unchanged, including when it is frozen.
- AC4: A non-array input or any non-string element throws `TypeError`.

## Non-goals

No persistence, UI, API, locale-specific case folding, Unicode normalization,
external dependencies, or changes to the tracker's own data model.

## Scope and authorization

This small example is part of the user's authorization to implement a runnable
workflow demonstration. The spec and implementation are handled in the same
authorized task. No additional human approval or independent reviewer is claimed.
There are no open requirements questions.
