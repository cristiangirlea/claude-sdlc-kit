#!/usr/bin/env bash
# Vendor the kit into a project as plain files.
#
# Use this when you do not want the marketplace mechanism - the copied files
# are committed to the target repo, so the whole team gets them with a pull
# and can edit them in place.
#
#   ./scripts/install.sh [target] [--tool claude|codex] [--templates] [--force] [--dry-run]
#
#   target        defaults to the current directory
#   --tool        which adapter to vendor (default: claude)
#   --templates   also seed AGENTS.md, the CLAUDE.md pointer, git hook, docs/, PR + CI templates
#   --force       overwrite files that already exist (default: skip and report)
#   --dry-run     print what would happen, change nothing
#
# Existing files are never overwritten without --force.

set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="."
TOOL="claude"
TEMPLATES=0
FORCE=0
DRY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --tool) TOOL="${2:-}"; shift 2 ;;
    --templates) TEMPLATES=1; shift ;;
    --force) FORCE=1; shift ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
    -*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) TARGET="$1"; shift ;;
  esac
done

case "$TOOL" in
  claude|codex) ;;
  *) echo "--tool must be claude or codex (got: $TOOL)" >&2; exit 2 ;;
esac

[ -d "$KIT_DIR/adapters/$TOOL" ] || { echo "adapters/$TOOL is missing - run: node scripts/build.mjs" >&2; exit 1; }
[ -d "$TARGET" ] || { echo "no such directory: $TARGET" >&2; exit 1; }
TARGET="$(cd "$TARGET" && pwd)"

if [ "$TARGET" = "$KIT_DIR" ]; then
  echo "refusing to install the kit into itself" >&2
  exit 1
fi

copied=0; skipped=0
say() { printf '%s\n' "$*"; }

copy() { # copy <src-file> <dest-file>
  local src="$1" dest="$2"
  if [ -e "$dest" ] && [ "$FORCE" -eq 0 ]; then
    say "  skip    ${dest#$TARGET/} (exists)"
    skipped=$((skipped + 1))
    return
  fi
  if [ "$DRY" -eq 1 ]; then
    say "  would   ${dest#$TARGET/}"
  else
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    say "  install ${dest#$TARGET/}"
  fi
  copied=$((copied + 1))
}

copy_tree() { # copy_tree <src-dir> <dest-dir>
  local src="$1" dest="$2"
  [ -d "$src" ] || return 0
  while IFS= read -r -d '' f; do
    copy "$f" "$dest/${f#$src/}"
  done < <(find "$src" -type f -print0)
}

say "kit:    $KIT_DIR"
say "target: $TARGET"
say "tool:   $TOOL"
[ "$DRY" -eq 1 ] && say "(dry run)"
say ""
say "plugins:"

for plugin in sdlc tracker; do
  SRC="$KIT_DIR/adapters/$TOOL/$plugin"
  [ -d "$SRC" ] || continue

  if [ "$TOOL" = "claude" ]; then
    copy_tree "$SRC/agents"  "$TARGET/.claude/agents"
    copy_tree "$SRC/skills"  "$TARGET/.claude/skills"
    copy_tree "$SRC/hooks"   "$TARGET/.claude/hooks"
    copy_tree "$SRC/scripts" "$TARGET/.claude/plugins/$plugin/scripts"
    # Project commands are namespaced by directory: .claude/commands/sdlc/spec.md -> /sdlc:spec
    copy_tree "$SRC/commands" "$TARGET/.claude/commands/$plugin"
  else
    copy_tree "$SRC/skills"     "$TARGET/.codex/plugins/$plugin/skills"
    copy_tree "$SRC/references" "$TARGET/.codex/plugins/$plugin/references"
    copy_tree "$SRC/scripts"    "$TARGET/.codex/plugins/$plugin/scripts"
  fi
done

if [ "$TEMPLATES" -eq 1 ]; then
  say ""
  say "templates:"
  copy "$KIT_DIR/templates/AGENTS.md" "$TARGET/AGENTS.md"
  copy "$KIT_DIR/templates/CLAUDE.md" "$TARGET/CLAUDE.md"
  copy "$KIT_DIR/templates/git-hooks/pre-commit" "$TARGET/.githooks/pre-commit"
  copy "$KIT_DIR/templates/.github/pull_request_template.md" "$TARGET/.github/pull_request_template.md"
  copy "$KIT_DIR/templates/.github/workflows/quality-gates.yml" "$TARGET/.github/workflows/quality-gates.yml"
  copy "$KIT_DIR/templates/docs/specs/README.md"   "$TARGET/docs/specs/README.md"
  copy "$KIT_DIR/templates/docs/adr/README.md"     "$TARGET/docs/adr/README.md"
  copy "$KIT_DIR/templates/docs/tracker/README.md" "$TARGET/docs/tracker/README.md"
  copy "$KIT_DIR/src/skills/spec-writing/references/spec-template.md" "$TARGET/docs/specs/SPEC-template.md"
  copy "$KIT_DIR/src/skills/adr-writing/references/adr-template.md"   "$TARGET/docs/adr/ADR-template.md"
  if [ "$TOOL" = "claude" ]; then
    copy "$KIT_DIR/templates/settings.json" "$TARGET/.claude/settings.json"
  fi
fi

say ""
say "$copied file(s) installed, $skipped skipped."
say ""
say "Next:"
if [ "$TOOL" = "claude" ]; then
  say "  1. Run /sdlc:onboard - it writes an AGENTS.md whose commands it actually ran."
  say "  2. Run /tracker:setup local to start tracking work items."
  say "  3. Review .claude/settings.json before committing: the allow list should match this project's real commands."
  say "  4. Install the git guard too - it binds humans as well as agents:"
  say "       git config core.hooksPath .githooks && chmod +x .githooks/pre-commit"
else
  say "  1. Ask Codex to follow the sdlc-onboard skill - it writes an AGENTS.md whose commands it actually ran."
  say "  2. Use the tracker-setup skill to start tracking work items."
  say "  3. Codex has no per-tool-call hook, so the git guard is the guardrail:"
  say "       git config core.hooksPath .githooks && chmod +x .githooks/pre-commit"
  say ""
  say "  NOTE: the project-local .codex/plugins path is NOT verified against a live Codex install."
  say "  If your build does not pick it up, add this repo as a marketplace instead, or copy"
  say "  adapters/codex/<plugin>/skills/* into ~/.codex/skills/."
fi
