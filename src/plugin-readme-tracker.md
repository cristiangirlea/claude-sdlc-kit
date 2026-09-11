# `tracker` plugin

One command surface, two backends. Work the same way whether the team's issues live in files or in Jira.

## Backends

| Backend | State | Needs |
| --- | --- | --- |
| `local` (default) | Working, exercised | Node.js 18+ |
| `jira` | Designed and documented, **not yet run against a live instance** | API token or the Atlassian MCP server |

Chosen per repo in `.sdlc/tracker.json`:

```json
{ "backend": "local", "prefix": "TASK", "dir": "docs/tracker" }
```

## Commands

| Procedure | Effect |
| --- | --- |
| `{{CMD:tracker:setup}} [local\|jira]` | Configure the backend for this repo |
| `{{CMD:tracker:pick}} [title]` | Recommend the next item, or capture a new one |
| `{{CMD:tracker:start}} <id>` | Move to in-progress and create the linked branch |
| `{{CMD:tracker:sync}} [id]` | Push branch/PR/status from the repo onto the item |
| `{{CMD:tracker:comment}} <id> <text>` | Add a dated note to the item's log |
| `{{CMD:tracker:report}} [days]` | Standup summary, cross-checked against git |

## Local backend

One markdown file per item under `docs/tracker/`, with `key: value` frontmatter and a dated log. Plain files on purpose: they diff, they review, they need no service, and they are readable by a person and an agent alike.

```bash
node {{PLUGIN_ROOT}}/scripts/tracker.mjs new "Add saved searches" --type feature --priority P2
node {{PLUGIN_ROOT}}/scripts/tracker.mjs list --status ready
node {{PLUGIN_ROOT}}/scripts/tracker.mjs move TASK-1 in-progress
node {{PLUGIN_ROOT}}/scripts/tracker.mjs set TASK-1 branch=feat/TASK-1-saved-searches pr=123
node {{PLUGIN_ROOT}}/scripts/tracker.mjs comment TASK-1 "blocked on the auth decision"
node {{PLUGIN_ROOT}}/scripts/tracker.mjs report --days 7
node {{PLUGIN_ROOT}}/scripts/tracker.mjs next
```

States: `backlog -> ready -> in-progress -> in-review -> done`, plus `blocked`.

## Jira backend

Read `skills/jira-integration/SKILL.md` for setup and field mapping, `references/jira-rest.md` for the exact calls, and `references/jira-setup-plan.md` for the phased rollout.

The short version: **discover, do not assume** - transition ids, custom field ids and required fields are instance-specific; **reads are free, writes are confirmed**; **the first end-to-end run goes to a sandbox project**; and a session never closes a ticket on its own judgement.
