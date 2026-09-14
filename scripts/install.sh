#!/usr/bin/env bash
# Vendor into an existing project. Node implements both platform entry points.
set -euo pipefail
KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$KIT_DIR/scripts/install.mjs" "$@"
