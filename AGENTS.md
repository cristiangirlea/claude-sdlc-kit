# claude-sdlc-kit

A project-agnostic SDLC kit for coding agents. `src/` is the single source of truth; `adapters/claude/` and `adapters/codex/` are **generated** from it and committed so that installing needs no build step.

## Commands

| Task | Command |
| --- | --- |
| Build the adapters | `node scripts/build.mjs` |
| Check adapters match src | `node scripts/build.mjs --check` |
| Validate everything | `node scripts/validate-kit.mjs` |
| Vendor into a project | `./scripts/install.sh <target> --tool claude\|codex --templates` |
| Exercise the tracker CLI | `node src/scripts/tracker.mjs --help` |

There is no test runner: the kit is prompts plus three small Node scripts. `validate-kit.mjs` is the gate, and it runs `build --check` as its last step.

## Layout

```
src/              the truth: skills/, agents/, commands/, hooks/, scripts/, manifest.json
adapters/         GENERATED - never edit by hand
templates/        files copied into a target project
docs/             adoption, walkthrough, authoring rules
scripts/          build, validate, install
```

## Conventions

- **Never edit `adapters/`.** Edit `src/`, then run `node scripts/build.mjs`. The validator fails on drift, and a hand-edited adapter is silently lost on the next build.
- **`src/manifest.json` decides what ships where.** A new skill must be claimed by exactly one plugin or the validator errors - unclaimed content would ship nowhere.
- **Tool-specific text uses tokens, not literals**: `{{CMD:sdlc:spec}}`, `{{AGENT:code-reviewer}}`, `{{MEMORY}}`, `{{ARGS}}`, `{{PLUGIN_ROOT}}`, `{{SETTINGS}}`, `{{TOOL}}`. Where the two tools genuinely diverge, use `<!-- if:claude -->` / `<!-- if:codex -->` blocks.
- **A skill's `description` is its trigger.** Write it as "what this covers - use when A, B, C". Under 1024 characters.
- **Hooks always exit 0.** A deny is JSON on stdout. A hook bug must never block a user's work.
- These files are prompts. Specific beats general; state the failure mode; name the exception. See `docs/AUTHORING.md`.

## Constraints

- Nothing here has been run against a live Jira instance. Keep the Jira material framed as a phased plan with discovery steps, never as verified constants.
- The Codex adapter's format was derived from an installed Codex build's on-disk layout, not from documentation. Do not present it as guaranteed.
- Do not add a dependency. The kit is Node-standard-library only, on purpose.

## Gotchas

- `core.autocrlf` on Windows would ship `install.sh` with CRLF and break it on Linux. `.gitattributes` pins LF; do not remove it.
- The generated-file stamp goes *after* frontmatter - a comment before `---` would break skill parsing.
