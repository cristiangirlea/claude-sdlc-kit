# Work items

One markdown file per item: `<PREFIX>-<n>-<slug>.md`. Frontmatter holds the state; the body holds the description, acceptance criteria and a dated log.

These are plain files on purpose. They diff, they get reviewed alongside the code they describe, they need no service or credentials, and both a person and an agent can read them.

## States

`backlog` -> `ready` -> `in-progress` -> `in-review` -> `done`, plus `blocked`.

- `ready` means someone understands it well enough to start.
- At most **one** `in-progress` item per person.
- `blocked` must name the blocker and who can clear it.
- `done` names the PR that closed it.

## Commands

`/tracker:pick`, `/tracker:start <id>`, `/tracker:sync`, `/tracker:comment <id> <text>`, `/tracker:report`.

Directly:

```bash
node <kit>/plugins/tracker/scripts/tracker.mjs list --status ready
node <kit>/plugins/tracker/scripts/tracker.mjs new "<title>" --type feature --priority P2
node <kit>/plugins/tracker/scripts/tracker.mjs move <ID> in-progress
```

Configuration lives in `.sdlc/tracker.json`. Switching this project to Jira changes that file and nothing else about how the work is done.
