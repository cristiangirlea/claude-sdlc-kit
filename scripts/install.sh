#!/usr/bin/env bash
# Install the SDLC kit into a project as plain .claude/ files.
#
# Use this when you do not want the plugin/marketplace mechanism - the copied
# files are committed to the target repo, so the whole team gets them with a
# pull and can edit them in place.
#
#   ./scripts/install.sh [target-repo] [--templates] [--force] [--dry-run]
#
#   target-repo   defaults to the current directory
#   --templates   also seed CLAUDE.md, .claude/settings.json, docs/, PR template
#   --force       overwrite files that already exist (default: skip and report)
#   --dry-run     print what would happen, change nothing
#
# Existing files are never overwritten without --force.

set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="."
TEMPLATES=0
FORCE=0
DRY=0

for arg in "$@"; do
  case "$arg" in
    --templates) TEMPLATES=1 ;;
    --force) FORCE=1 ;;
    --dry-run) DRY=1 ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    -*) echo "unknown flag: $arg" >&2; exit 2 ;;
    *) TARGET="$arg" ;;
  esac
done

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
[ "$DRY" -eq 1 ] && say "(dry run)"
say ""

say "agents, skills, hooks:"
for plugin in sdlc tracker; do
  copy_tree "$KIT_DIR/plugins/$plugin/agents"  "$TARGET/.claude/agents"
  copy_tree "$KIT_DIR/plugins/$plugin/skills"  "$TARGET/.claude/skills"
  copy_tree "$KIT_DIR/plugins/$plugin/hooks"   "$TARGET/.claude/hooks"
  copy_tree "$KIT_DIR/plugins/$plugin/scripts" "$TARGET/.claude/plugins/$plugin/scripts"
  # Project commands are namespaced by directory: .claude/commands/sdlc/spec.md -> /sdlc:spec
  copy_tree "$KIT_DIR/plugins/$plugin/commands" "$TARGET/.claude/commands/$plugin"
done

if [ "$TEMPLATES" -eq 1 ]; then
  say ""
  say "templates:"
  copy "$KIT_DIR/templates/CLAUDE.md"    "$TARGET/CLAUDE.md"
  copy "$KIT_DIR/templates/settings.json" "$TARGET/.claude/settings.json"
  copy "$KIT_DIR/templates/.github/pull_request_template.md" "$TARGET/.github/pull_request_template.md"
  copy "$KIT_DIR/templates/.github/workflows/quality-gates.yml" "$TARGET/.github/workflows/quality-gates.yml"
  copy "$KIT_DIR/templates/docs/specs/README.md"   "$TARGET/docs/specs/README.md"
  copy "$KIT_DIR/templates/docs/adr/README.md"     "$TARGET/docs/adr/README.md"
  copy "$KIT_DIR/templates/docs/tracker/README.md" "$TARGET/docs/tracker/README.md"
  copy "$KIT_DIR/plugins/sdlc/skills/spec-writing/references/spec-template.md" "$TARGET/docs/specs/SPEC-template.md"
  copy "$KIT_DIR/plugins/sdlc/skills/adr-writing/references/adr-template.md"   "$TARGET/docs/adr/ADR-template.md"
fi

say ""
say "$copied file(s) installed, $skipped skipped."
say ""
say "Next:"
say "  1. Run /sdlc:onboard in the target repo - it writes a CLAUDE.md whose commands it has actually run."
say "  2. Run /tracker:setup local to start tracking work items."
say "  3. Review .claude/settings.json before committing it: the allow list should match this project's real commands."
say ""
say "The hooks in .claude/hooks/ are only wired up if .claude/settings.json references them."
