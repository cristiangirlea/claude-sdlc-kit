# Adopting the kit

Two installation routes, then a staged rollout. Do not turn everything on at once - a process nobody asked for gets ignored, and an ignored process is worse than none because it makes the artefacts untrustworthy.

## Route A - as a plugin (recommended)

The kit stays in its own repo; projects reference it. Updates arrive by updating the plugin.

```
/plugin marketplace add cristiangirlea/claude-sdlc-kit
/plugin install sdlc@sdlc-kit
/plugin install tracker@sdlc-kit
```

Nothing is copied into the project; the commands, agents, skills and hooks are available in every repo where you enable the plugin.

**Use this when** you want one canonical copy across many projects, and updates without a per-repo pull.

## Route B - vendored into the project

Copy the files into the target repo's `.claude/` and commit them.

```bash
./scripts/install.sh /path/to/repo --templates
```

```powershell
.\scripts\install.ps1 -Target C:\src\my-repo -Templates
```

Existing files are skipped unless you pass `--force` / `-Force`; `--dry-run` / `-DryRun` shows what would happen.

**Use this when** the team wants to read and edit the prompts in the repo they belong to, or when you want the workflow pinned per project. The cost is drift: each repo's copy ages separately.

## Either way: onboard the repo

```
/sdlc:onboard
```

This is the step that grounds a generic kit in a specific project. It discovers the real build/test/lint commands (from CI, which is the definition of green), traces one request path, reads the recently-changed files for actual conventions, **runs** everything it is about to write down, and produces a `CLAUDE.md` and a `.claude/settings.json` that are true.

Then:

```
/tracker:setup local
```

## Staged rollout for a team

**Week 1 - read-only value.** Install. Use `/sdlc:review` and `/sdlc:verify` only. Nothing about how anyone works changes; the review findings are the argument for the rest.

**Week 2 - the front of the loop.** Add `/sdlc:spec` and `/sdlc:plan` for anything that will take more than a day. The specs are the artefact people notice first, because they end arguments about scope.

**Week 3 - tracking and shipping.** Turn on the tracker (local backend), then `/sdlc:ship` for the PR discipline. By now the id-through-everything convention has something to attach to.

**Week 4+ - Jira, if you have it.** Follow the phased plan in `plugins/tracker/skills/jira-integration/references/jira-setup-plan.md`. Read-only first, sandbox project second, writes on your own issues third. Never start on the team's live board.

## What to customise

| File | Change it to |
| --- | --- |
| `templates/settings.json` -> `.claude/settings.json` | The project's real commands in `allow`; keep `deny` strict |
| `CLAUDE.md` | Everything - it is per project by definition |
| `definition-of-done` skill | Add the gates your domain needs (accessibility, compliance, i18n, performance budgets) |
| `code-review-standards` skill | Add the defect classes your incidents actually produce |
| `git-workflow` skill | Branch prefixes and commit scopes that match your repo's history |
| `tracker-workflow` skill | State names, if your board's workflow differs |

Customise by **editing the skill in place** (Route B) or by forking the kit (Route A). Both are fine; what is not fine is leaving a skill that contradicts how the team actually works - a session will follow the written rule over the unwritten one.

## What not to do

- **Do not enable all ten commands on day one.** People adopt one habit at a time.
- **Do not let `CLAUDE.md` grow past a page.** It loads into every session; every stale line costs trust and tokens.
- **Do not automate the tracker's `done` transition.** A machine closing tickets is the fastest way to lose a team's trust in both the tracker and the tooling.
- **Do not skip `/sdlc:onboard`** and hand-write `CLAUDE.md` from memory. Unverified commands are the single most common cause of a confidently wrong session.

## Measuring whether it is working

After a month, ask:

- Are review findings catching things that used to reach production? (The point.)
- Are specs ending scope arguments before implementation, or generating ceremony after it? (If the latter, you are writing specs for changes that do not need them.)
- Is `CLAUDE.md` still true? (If not, that is the first thing to fix.)
- Do people run the commands when nobody is watching? (The only honest adoption metric.)
