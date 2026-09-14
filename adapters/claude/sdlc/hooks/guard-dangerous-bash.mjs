#!/usr/bin/env node
// PreToolUse(Bash) guard.
//
// Denies a small, deliberately short list of shell commands that destroy work
// or publish it irreversibly. The list is short on purpose: a guard that fires
// on ordinary commands gets disabled, and a disabled guard protects nothing.
//
// Contract:
// - Reads the hook payload as JSON on stdin.
// - Always exits 0. A deny is expressed as `permissionDecision: "deny"` on
//   stdout, so a bug in this script can never block legitimate work.
// - Denies are advisory to the user, not to the model's honesty: the reason
//   text tells Claude what to do instead (ask the human to run it).
//
// Project override: create `.sdlc/allow-dangerous.txt` in the repo with one
// exact command per line to exempt it. Use sparingly, and never for a secret.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const RULES = [
  {
    test: command => [...command.matchAll(/\brm\s+((?:(?:-[a-zA-Z]+|--recursive|--force)\s+)+)/g)].some(match => {
      const flags = match[1].trim().split(/\s+/);
      return flags.some(f => f === "--recursive" || /^-[^-]*[rR]/.test(f)) &&
        flags.some(f => f === "--force" || /^-[^-]*f/.test(f));
    }),
    why: "Recursive force delete. Ask the human to run it, or delete specific paths without -rf.",
  },
  {
    re: /\bgit\s+push\b[^\n]*(?:--force(?!-with-lease)\b|\s-[a-zA-Z]*f\b)/,
    why: "Force push rewrites history other people may have. Use --force-with-lease on your own branch, and only when the user explicitly asks.",
  },
  {
    re: /\bgit\s+reset\s+--hard\b/,
    why: "Discards uncommitted work irreversibly. Commit a WIP commit instead, or ask the human to run it.",
  },
  {
    re: /\bgit\s+clean\s+-[a-zA-Z]*f/,
    why: "Deletes untracked files irreversibly. List them first with `git clean -n` and let the human decide.",
  },
  {
    re: /\bgit\s+stash\b(?!\s+(list|show))/,
    why: "The stash stack is shared across worktrees, so a pop can take someone else's work. Use a temporary WIP commit instead.",
  },
  {
    re: /\bgit\s+(tag\s+-d|push\s+[^\n]*--delete|push\s+[^\n]*:refs\/)/,
    why: "Deletes a published ref. This is a human's call.",
  },
  {
    re: /\b(chmod|chown)\s+(-[a-zA-Z]+\s+)*777\b/,
    why: "World-writable permissions. Grant the narrowest permission that works.",
  },
  {
    re: /\bcurl\b[^\n|]*\|\s*(sudo\s+)?(ba)?sh\b/,
    why: "Piping a downloaded script straight into a shell executes unreviewed code. Download it, read it, then run it.",
  },
  {
    re: /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
    why: "Destructive schema operation. Run it through a reviewed, reversible migration.",
  },
  {
    re: /\b(kubectl|docker)\b[^\n]*\b(delete|rm)\b[^\n]*\b(--all|-A)\b/,
    why: "Bulk deletion of running resources. Name the specific resource, or hand it to a human.",
  },
];

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function allowList(cwd) {
  try {
    const p = join(cwd || process.cwd(), ".sdlc", "allow-dangerous.txt");
    if (!existsSync(p)) return [];
    return readFileSync(p, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  } catch {
    return [];
  }
}

function main() {
  const raw = readStdin();
  if (!raw.trim()) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return; // Unparseable payload: stay silent rather than block.
  }

  if (payload.tool_name !== "Bash") return;
  const command = payload.tool_input?.command;
  if (typeof command !== "string" || !command.trim()) return;

  if (allowList(payload.cwd).includes(command.trim())) return;

  // Normalize common Git global options for matching only. This is a limited
  // heuristic, not a shell parser or a substitute for sandbox permissions.
  const normalized = command.replace(/\bgit(?:\s+(?:-C|-c|--git-dir|--work-tree)(?:=|\s+)(?:"[^"]*"|'[^']*'|[^\s;&|]+))+\s+/g, "git ");
  const hit = RULES.find((r) => r.test ? r.test(normalized) : r.re.test(normalized));
  if (!hit) return;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          `Blocked by the sdlc kit's dangerous-command guard.\n${hit.why}\n` +
          `Command: ${command}\n` +
          `If this is genuinely needed, explain it to the user and let them run it themselves.`,
      },
    })
  );
}

try {
  main();
} catch {
  // Never block on an internal error.
}
process.exit(0);
