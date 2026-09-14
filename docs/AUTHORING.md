# Authoring rules for this kit

How to add or change content here, and the conventions that keep these files as prompts rather than a folder of vague advice.

**Edit `src/`. Never edit `adapters/`.** The adapters are generated; a hand edit there is silently discarded on the next build. After any change:

```bash
node scripts/build.mjs && node scripts/validate-kit.mjs
```

## Where things live

```
src/skills/<name>/SKILL.md        knowledge, loaded when the description matches
src/agents/<name>.md              a role with its own context window (Claude) / its own pass (Codex)
src/commands/<plugin>/<name>.md   a procedure a human invokes by name
src/hooks/                        limited session checks (wired for Claude Code)
src/scripts/                      real programs, tool-agnostic
src/manifest.json                 which of the above ships in which plugin
```

`manifest.json` is load-bearing: a skill claimed by no plugin ships nowhere, and the validator treats that as an error rather than letting it disappear quietly.

## The four extension points, and when each is right

| You want to... | Use |
| --- | --- |
| Give the model knowledge it should apply when a situation arises | **Skill** |
| Hand a bounded job to a separate context | **Role** (`src/agents/`) |
| Give the user a repeatable procedure to invoke by name | **Command** |
| Enforce something regardless of what the model decides | **Hook**, or better, a **git hook** |

The distinction that matters: a skill is *loaded when relevant*, a role is *run with its own context*, a command is *invoked by a human*, and a configured hook *runs on its supported events*. If a rule must hold every time, it is a hook - not a paragraph in a skill hoping to be read.

The optional files in `templates/git-hooks/` check normal commits across tools. Local hooks can be disabled or bypassed; absolute enforcement requires sandbox or server-side policy.

## Writing for two tools at once

Source files are rendered per adapter. Two constructs do the work.

### Tokens

| Token | Claude Code | Codex |
| --- | --- | --- |
| `{{CMD:sdlc:spec}}` | `/sdlc:spec` | `` the `sdlc-spec` skill `` |
| `{{AGENT:code-reviewer}}` | `` `code-reviewer` agent `` | `` `code-reviewer` role (references/agents/…) `` |
| `{{MEMORY}}` | `CLAUDE.md` | `AGENTS.md` |
| `{{ARGS}}` | `$ARGUMENTS` | `the user's request` |
| `{{PLUGIN_ROOT}}` | `${CLAUDE_PLUGIN_ROOT}` | `<absolute plugin resource root>` resolved from the skill's linked helper |
| `{{SETTINGS}}` | `.claude/settings.json` | `~/.codex/config.toml` |
| `{{TOOL}}` | `Claude Code` | `Codex` |

Never write these literals directly in `src/` - the validator rejects unknown tokens, but it cannot catch a hard-coded `/sdlc:spec` that will read as nonsense in the Codex output.

### Conditional blocks

```markdown
<!-- if:claude -->
Text that only makes sense with hooks and subagents.
<!-- endif -->
<!-- if:codex -->
The equivalent that is true for Codex.
<!-- endif -->
```

Use these only where the tools genuinely diverge - guardrail mechanics, dispatch, the `!` command prefill. Reach for a token first; a conditional block is two pieces of prose to keep true instead of one.

All frontmatter is a flat map whose values are JSON-quoted strings or string arrays. This subset is valid YAML and is strictly parsed by `scripts/frontmatter.mjs`. Use JSON escaping for quotes and backslashes; unsupported block scalars or unquoted values fail validation.

Resolve Codex helper links relative to the loaded skill file, then invoke the absolute script path while retaining the project working directory. Never change into the plugin cache to run a project tracker command.

## Skills

```
src/skills/<kebab-case-name>/SKILL.md
src/skills/<kebab-case-name>/references/*.md    # optional, loaded on demand
```

```yaml
---
name: "skill-name"
description: "What this covers and when to use it."
---
```

- **The description is the whole trigger mechanism**, on both tools. Write it as "X - use when A, B, C", naming situations concretely. A description that only says what the skill contains will not fire when it should.
- **Under 1024 characters.**
- **Body: one page.** Deep material goes in `references/`, linked from the body. The body is always loaded; references are not.
- **Write rules, not essays.** Tables, checklists, "do this, not that". Include the anti-patterns explicitly - they are what people actually get wrong.
- **Be opinionated.** A skill that says "consider several approaches" changes no behaviour.

## Roles (`src/agents/`)

```yaml
---
name: "agent-name"
description: "When to dispatch this role. Put examples in the body."
tools: "Read, Grep, Glob, Bash"
model: "inherit"
color: "cyan"
---
```

Body structure that works: **role** (one line), **operating rules** (numbered, non-negotiable), **method** (steps), **output format** (a fenced template), **quality bar** (the check before returning).

- **Least privilege in `tools`.** On Claude Code this is enforced; on Codex it renders as a rule the model is asked to follow. Write the rule anyway - and say what the role must *not* do in the body, since that is the part that transfers.
- **Specify the output format**, because the caller parses it into the next step.
- **One job.** A role that specs *and* plans *and* implements is a worse version of the main thread.

## Commands (`src/commands/<plugin>/`)

```yaml
---
description: "One line describing the procedure and when to invoke it."
argument-hint: "[what to pass]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Task"]
---
```

- `{{ARGS}}` interpolates what the user typed. Handle the empty case explicitly.
- Number the steps. A command is a procedure, not a mood.
- **State the gate** it enforces and what it hands to the next stage.
- **Say where to stop.** Most of these deliberately end before the next stage so a human stays in the loop; if yours does, write it down or the model will helpfully continue.
- On Codex these become skills named `<plugin>-<command>`, so the description carries the whole trigger. Make it good.

## Hooks (`src/hooks/`)

- **Always exit 0.** Express a deny with `hookSpecificOutput.permissionDecision: "deny"` on stdout. A hook that exits non-zero on its own bug blocks the user's work, and they will disable the kit rather than debug it.
- **Self-guard and stay silent** when the event is not relevant.
- **Be fast.** This runs on every matching tool call. No network, no full-repo scan.
- **Keep the deny list short.** A guard that fires on ordinary commands gets turned off, and then it protects nothing.
- Reference scripts as `${CLAUDE_PLUGIN_ROOT}/hooks/<name>.mjs`.

## Writing style for everything here

These files are prompts. They are read by a model that will follow them literally, and by a human deciding whether to trust the kit.

1. **Specific over general.** "Assert on the persisted row, not the mock's call count" beats "write good tests".
2. **Say the failure mode.** Rules land when the reader knows what goes wrong without them.
3. **Show the shape of the output** you want, as a template.
4. **Name the exception.** A rule with no stated exception gets applied where it does not belong.
5. **No hedging.** "Consider possibly reviewing" produces nothing. "Run the security auditor when the diff touches auth" produces a review.
6. **Cut anything the model already knows.** Generic programming advice is padding; project- and process-specific rules are the value.

## Adding a tool adapter

`scripts/build.mjs` has an `ADAPTERS` map: an output directory, a marketplace path, a plugin-manifest directory, and a token table. Adding a third tool means adding an entry there and a `build<Tool>Plugin` function that decides how skills, roles and procedures map onto that tool's concepts. Nothing in `src/` should need to change - if it does, that is a sign a literal leaked in where a token belonged.

## Before committing

- [ ] `node scripts/build.mjs` run, and the adapter changes are in the commit.
- [ ] `node scripts/validate-kit.mjs` is clean.
- [ ] New content is claimed in `src/manifest.json`.
- [ ] The description says **when** to use it, not just what it is.
- [ ] Any `references/` file it mentions exists.
- [ ] Hooks run by hand against a sample payload: `echo '<json>' | node src/hooks/<name>.mjs`.
- [ ] The README tables list the new skill / role / procedure.
