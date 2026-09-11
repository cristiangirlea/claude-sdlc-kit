# Templates

Files to copy into a target project. `scripts/install.sh --templates` (or `install.ps1 -Templates`) copies them all, skipping anything that already exists.

| File | Goes to | Notes |
| --- | --- | --- |
| `CLAUDE.md` | repo root | Project memory, loaded into every session. Prefer generating it with `/sdlc:onboard`, which verifies every command it writes down |
| `settings.json` | `.claude/settings.json` | Permissions and hook wiring. Commit it - the whole team gets the same behaviour |
| `.github/pull_request_template.md` | `.github/` | The Verification section is the one that matters |
| `.github/workflows/quality-gates.yml` | `.github/workflows/` | Example CI running the same gates as `/sdlc:verify` |
| `docs/specs/README.md` | `docs/specs/` | What belongs in a spec |
| `docs/adr/README.md` | `docs/adr/` | What deserves an ADR |
| `docs/tracker/README.md` | `docs/tracker/` | Local tracker item conventions |

## About `settings.json`

JSON has no comments, so the notes live here.

**`permissions.allow`** - routine, read-only or safe commands you do not want to approve every time. The list shipped here covers Go, Node, Python and Rust; **delete the ones this project does not use** and add the project's real commands. Start restrictive and add an entry when a prompt actually annoys you, not in anticipation.

**`permissions.deny`** - the things that should never happen unattended. Keep these even if you loosen `allow`.

**`hooks`** - only needed when the kit is **vendored** into `.claude/`. If you installed the `sdlc` plugin instead, it ships its own `hooks/hooks.json` and this block is redundant: delete it to avoid running each hook twice.

`$CLAUDE_PROJECT_DIR` resolves to the repo root, so the paths work regardless of the session's working directory.

Personal, uncommitted overrides belong in `.claude/settings.local.json` (add it to `.gitignore`).

## About `CLAUDE.md`

It loads into every session, so it is expensive context. Four rules keep it worth its cost:

1. Every command in it must have been **run** and observed to work.
2. Say only what the code does not already say.
3. Delete lines the moment they stop being true.
4. One page. Past two, move detail into a skill or a doc and link it.

## About the CI workflow

The point of shipping a CI template is that **`/sdlc:verify` and CI run the same commands**. When they drift, CI wins and `CLAUDE.md` is wrong. Replace the Go blocks with whatever this project actually uses, and keep the two guardrail steps (no secrets committed, migrations reversible) - they are cheap and they catch the expensive mistakes.
