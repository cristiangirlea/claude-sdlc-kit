---
description: Configure the issue-tracker backend for this repository
argument-hint: "[local | jira]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit"]
---

# Set up the tracker

**Backend:** {{ARGS}} (default: `local`)

Follow `tracker-workflow`.

## local

1. Create `.sdlc/tracker.json`:
   ```json
   { "backend": "local", "prefix": "TASK", "dir": "docs/tracker" }
   ```
   Pick a prefix that matches the project (`JP`, `API`, `TASK`). It ends up in every branch name, so keep it short.
2. Create `docs/tracker/` with a `README.md` explaining that each file is one work item and that the files are meant to be reviewed like code.
3. Create one item to prove the loop works: `node "{{PLUGIN_ROOT}}/scripts/tracker.mjs" new "Adopt the SDLC kit" --type chore --priority P3`.
4. Show the user the file and the command list.

## jira

Follow `jira-integration`, and do not skip its phases - the first write goes to a sandbox project, never the team's board.

1. Confirm credentials exist in the environment (`JIRA_EMAIL`, `JIRA_API_TOKEN`). If they do not, tell the user how to create a token and **let them set it themselves** - never ask for the token in chat and never write it to a file.
2. Verify access read-only: `GET /rest/api/3/myself`.
3. Discover the instance's real shape: project metadata, issue types, statuses, transition ids per status, and the custom field ids you need.
4. Write `.sdlc/tracker.json` with the discovered mapping - never with the example values from the skill.
5. Run the read-only queries (`{{CMD:tracker:report}}`) and confirm the picture is right.
6. **Stop.** Report what works read-only and what is still untested for writes. Writes get enabled deliberately, per the phased plan.

## Both

- Add `.sdlc/` to the repo (it is configuration, it belongs in version control) but keep credentials out of it.
- Note the chosen backend in `{{MEMORY}}` so future sessions do not have to re-discover it.
