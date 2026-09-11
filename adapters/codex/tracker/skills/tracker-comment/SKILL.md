---
name: tracker-comment
description: Add a note to a work item's log. Use when the user asks for the tracker "comment" step by name, or reaches that stage of the SDLC loop.
---

<!-- Generated from src/commands/tracker/comment.md by scripts/build.mjs. Edit the source, not this file. -->

# Comment on an item

**Input:** the user's request (first token is the id; the rest is the note. With no id, use the id in the branch name.)

1. **Resolve the item.** If no id can be determined, ask rather than guessing - a comment on the wrong ticket is worse than none.
2. **Write the note for a reader who was not here.** State the decision, the blocker, or the finding, and what it means for the work. "Working on it" is not worth a comment.
3. **Post it.**
   - local: `node "./scripts/tracker.mjs" comment <ID> "<text>"` - the entry is dated and prepended to the item's Log.
   - jira: a comment notifies watchers. Show the exact text and wait for a yes. Remember Jira Cloud v3 takes ADF, not a plain string.
4. **Report** the item and the text that was recorded.

Worth commenting: a decision and its reason, a blocker and who can clear it, a scope change, a discovered constraint, a link to the PR or spec. Not worth commenting: routine progress, anything the git log already says.
