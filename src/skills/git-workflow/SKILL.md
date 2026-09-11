---
name: git-workflow
description: Branch, commit and pull-request conventions for this kit - trunk-based branching, tracker-id naming, Conventional Commits, atomic commit discipline, PR bodies that state what was verified, and the git operations that must never be automated. Use when creating a branch, staging and writing commits, opening or updating a PR, or cleaning up history before review.
---

# Git workflow

Trunk-based: short-lived branches off the default branch, merged small and often. A branch that lives a week is a merge conflict with a calendar entry.

## Branch names

```
<type>/<tracker-id>-<short-slug>
feat/PROJ-412-saved-searches
fix/PROJ-455-duplicate-matches
chore/no-id-bump-deps
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`. One tracker item per branch; if a branch needs two ids, it is two branches.

## Commits

**Conventional Commits**, imperative mood, present tense:

```
<type>(<scope>): <what changed, imperative, <=72 chars>

<why this change is needed and what it affects - wrap at 72>
<consequences a future reader needs: migrations, flags, follow-ups>

Refs: PROJ-412
```

Rules that matter more than the format:

1. **Atomic.** One logical change per commit. The test and the code it verifies belong together; a refactor and a behaviour change do not.
2. **The body explains why.** The diff already shows what. A commit whose body restates the diff wasted its own body.
3. **Green at every commit.** Someone will `git bisect` through this history. A commit that does not build breaks that.
4. **`BREAKING CHANGE:` in the footer** when a contract changes - that is what drives the version bump later.
5. **Never mix formatting churn with logic.** Format in its own commit, or not at all.

Scopes come from the repo's own structure (`api`, `web`, `store`, `discovery`) - be consistent with what is already in `git log`.

## Before you commit

- [ ] `git status` reviewed - nothing unintended staged, no `.env`, no key material, no large binary, no local scratch file.
- [ ] `git diff --staged` read end to end, as a reviewer would.
- [ ] Gates green (`{{CMD:sdlc:verify}}`).
- [ ] Debug prints, commented-out code and stray TODOs removed.

## Pull requests

Title: the same form as a commit subject, with the tracker id.

Body:

```markdown
## What
<one paragraph, user-visible framing>

## Why
<link to spec/ticket; the problem being solved>

## How
<the approach, and any trade-off a reviewer should not have to reverse-engineer>

## Verification
<the exact commands run and their result; screenshots for UI>

## Risk and rollback
<blast radius, flag, migration reversibility, how to undo>

## Notes for the reviewer
<where to start; anything deliberately out of scope>
```

The **Verification** section is the one that matters most: it converts "I think it works" into a claim someone can check. Never write it from expectation - write it from output you observed.

Keep PRs small. Under ~400 changed lines gets a real review; 2,000 gets a rubber stamp.

## History hygiene

- Rebase your own unmerged branch onto the trunk to keep it current; never rebase a branch someone else is building on.
- Squash noise ("fix typo", "wip") into the commit it belongs to before review.
- Do not squash a well-formed series into one commit just because a tool offers to - a good series is a better review.

## Never automate

These require an explicit human instruction each time, and even then a person should run them:

- `git push --force` to a shared branch (use `--force-with-lease` only on your own, and only when asked).
- `git reset --hard`, `git clean -fdx` on a dirty tree, or discarding uncommitted work.
- Deleting or moving tags; rewriting published history.
- Bare `git stash` / `git stash pop` in a repo with worktrees - the stack is shared. Prefer a WIP commit.
- Committing or pushing at all when the user has not asked for it.

## Worktrees for parallel work

Use `git worktree add` rather than branch-switching when several lines of work are live: each keeps its own build artefacts and dirty state, and no one has to stash. Clean up with `git worktree remove` when the branch merges.
