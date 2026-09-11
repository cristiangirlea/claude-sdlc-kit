# Authoring rules for this kit

How to add or change an agent, skill, command or hook here - and the conventions that keep them from turning into a folder of vague advice.

Run `node scripts/validate-kit.mjs` before committing. It catches the structural mistakes that make a plugin silently not load.

## The four extension points, and when each is right

| You want to... | Use |
| --- | --- |
| Give the model knowledge it should apply when a situation arises | **Skill** |
| Hand a bounded job to a separate context window | **Agent** |
| Give the user a repeatable action to invoke by name | **Command** |
| Enforce something deterministically, regardless of what the model decides | **Hook** |

The distinction that matters most: a skill is *loaded when relevant*, an agent is *dispatched with its own context*, a command is *typed by a human*, and a hook *always runs*. If a rule must hold every time, it is a hook - not a paragraph in a skill hoping to be read.

## Skills

```
skills/<kebab-case-name>/SKILL.md
skills/<kebab-case-name>/references/*.md    # optional, loaded on demand
```

Frontmatter:

```yaml
---
name: skill-name              # must equal the directory name
description: What this covers, and WHEN to use it - the triggering situations, in the user's words.
---
```

- **The description is the whole trigger mechanism.** It is what decides whether the skill loads. Write it as "X - use when A, B, C", naming the situations concretely. A description that only says what the skill contains will not fire when it should.
- **Under 1024 characters**, and every word earns its place.
- **Body: one page.** Deep material goes in `references/`, linked from the body. The body is always loaded; references are not.
- **Write rules, not essays.** Tables, checklists, and "do this, not that" beat prose. Include the anti-patterns explicitly - they are what people actually get wrong.
- **Be opinionated.** A skill that says "consider several approaches" changes no behaviour. Pick one, say why, and name the exception.

## Agents

```
agents/<kebab-case-name>.md
```

```yaml
---
name: agent-name              # must equal the filename
description: When to dispatch this agent, with 1-2 <example> blocks showing the trigger.
tools: Read, Grep, Glob, Bash   # least privilege - omit Write/Edit for read-only agents
model: inherit
color: cyan
---
```

Body structure that works: **role** (one line), **operating rules** (numbered, non-negotiable), **method** (the steps), **output format** (a fenced template), **quality bar** (the check before returning).

- **Least privilege in `tools`.** A reviewer with `Write` will eventually "helpfully" fix something and blow the scope. If the agent must not edit, do not give it the tool.
- **Say what it must not do**, explicitly: not edit files, not commit, not touch anything outside its slice.
- **Specify the output format**, because the caller has to parse it into the next step.
- **One job.** An agent that specs *and* plans *and* implements is a worse version of the main thread.

## Commands

```
commands/<name>.md            # plugin: /<plugin>:<name>
```

```yaml
---
description: One line, imperative - it shows in the command list.
argument-hint: "[what to pass]"
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Task"]
---
```

- `$ARGUMENTS` interpolates what the user typed. Handle the empty case explicitly - a command that breaks with no argument is a bad command.
- Number the steps. A command is a procedure, not a mood.
- **State the gate** the command enforces, and what it hands to the next stage.
- **Say where to stop.** Most of these commands deliberately end before the next stage so a human stays in the loop; if yours does, write it down or the model will helpfully continue.

## Hooks

```
hooks/hooks.json
hooks/<name>.mjs
```

- **Always exit 0.** Express a deny with `hookSpecificOutput.permissionDecision: "deny"` on stdout. A hook that exits non-zero on its own bug blocks the user's work, and they will disable the whole kit rather than debug it.
- **Self-guard and stay silent** when the event is not relevant. Noise on every tool call is how a hook gets removed.
- **Be fast.** This runs on every matching tool call. No network, no full-repo scan.
- **Keep the deny list short.** A guard that fires on ordinary commands gets turned off, and then it protects nothing.
- Reference scripts as `${CLAUDE_PLUGIN_ROOT}/hooks/<name>.mjs` so the plugin works wherever it is installed.

## Writing style for everything here

These files are prompts. They are read by a model that will follow them literally, and by a human deciding whether to trust the kit.

1. **Specific over general.** "Assert on the persisted row, not the mock's call count" beats "write good tests".
2. **Say the failure mode.** Rules land when the reader knows what goes wrong without them.
3. **Show the shape of the output** you want, as a template.
4. **Name the exception.** A rule with no stated exception gets applied where it does not belong.
5. **No hedging.** "Consider possibly reviewing" produces nothing. "Run the security auditor when the diff touches auth" produces a review.
6. **Cut anything the model already knows.** Generic programming advice is padding; project- and process-specific rules are the value.

## Before committing a change to the kit

- [ ] `node scripts/validate-kit.mjs` is clean.
- [ ] The new file's `name` matches its filename or directory.
- [ ] The description says **when** to use it, not just what it is.
- [ ] Any `references/` file it mentions exists.
- [ ] Hooks were run by hand against a sample payload (`echo '<json>' | node hooks/<name>.mjs`).
- [ ] The README tables list the new agent / skill / command.
