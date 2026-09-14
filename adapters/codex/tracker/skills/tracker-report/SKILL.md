---
name: "tracker-report"
description: "Standup-style summary - what moved, what is in flight, what is blocked. Use when the user asks for the tracker \"report\" step by name, or reaches that stage of the SDLC loop."
---

<!-- Generated from src/commands/tracker/report.md by scripts/build.mjs. Edit the source, not this file. -->

## Runtime paths

Resolve [the tracker CLI](../../scripts/tracker.mjs) relative to this SKILL.md. Replace `<absolute plugin resource root>` in commands with the absolute directory containing that `scripts/` folder. Keep the working directory at the user's project root; never change into the plugin to run the tracker. Use `--root "<absolute project root>"` when running from elsewhere.


# Report

**Window:** the user's request days (default 7)

Read-only. This command never writes to the tracker.

1. **Pull the tracker view.**
   - local: `node "<absolute plugin resource root>/scripts/tracker.mjs" report --days <n>`
   - jira: `project=PROJ AND updated >= -<n>d ORDER BY updated DESC`, plus `statusCategory=Done AND resolutiondate >= -<n>d` for what closed.
2. **Cross-check against git**, because the tracker is a claim and the repo is the evidence: `git log --oneline --since="<n> days ago"`, merged branches, open PRs (`gh pr list` if available).
3. **Report in this shape:**

   ```
   Done (<n>)          id - title - PR
   In flight (<n>)     id - title - branch, age, stage
   Blocked (<n>)       id - title - blocker, who can clear it
   Ready (<n>)         id - title - priority
   ```

4. **Name the discrepancies.** Merged work still open on the board; items marked in-progress with no commits in a week; branches with no item. These are the findings that make the report worth running - state them plainly rather than smoothing them over.
5. **End with one line**: what the biggest risk to the current window is.

Keep it short enough to read out loud.
