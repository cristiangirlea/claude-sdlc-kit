#!/usr/bin/env node
// SessionStart hook: inject a few lines of orientation so the session knows
// which branch it is on, which tracker item that maps to, and whether a spec
// and plan already exist for it.
//
// Deliberately tiny: this text is prepended to every session in the project,
// so it must be cheap and never speculative. Silent when there is nothing
// useful to say.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function trackerIdFromBranch(branch) {
  // feat/PROJ-412-slug -> PROJ-412 ; fix/42-slug -> 42
  const m = branch.match(/\/([A-Z][A-Z0-9]+-\d+)/) || branch.match(/\/(\d+)-/);
  return m ? m[1] : "";
}

function findFile(dir, idPart) {
  try {
    const full = join(cwd, dir);
    if (!existsSync(full)) return "";
    const hit = readdirSync(full).find((f) => idPart && f.includes(idPart));
    // Forward slashes so the path stays clickable on every platform.
    return hit ? `${dir}/${hit}` : "";
  } catch {
    return "";
  }
}

function specStatus(relPath) {
  try {
    const text = readFileSync(join(cwd, relPath), "utf8");
    const m = text.match(/^-?\s*\*\*Status:\*\*\s*(.+)$/m);
    const hasPlan = /^##\s+Plan\b/m.test(text);
    return { status: m ? m[1].trim() : "unknown", hasPlan };
  } catch {
    return { status: "unknown", hasPlan: false };
  }
}

function main() {
  const branch = git(["branch", "--show-current"]);
  if (!branch) return; // not a git repo - stay silent

  const lines = [];
  const dirty = git(["status", "--porcelain"]);
  lines.push(
    `Branch \`${branch}\`${dirty ? ` - ${dirty.split("\n").length} file(s) with uncommitted changes` : " - clean tree"}`
  );

  const id = trackerIdFromBranch(branch);
  if (id) {
    lines.push(`Work item id from branch: ${id}`);
    const spec = findFile("docs/specs", id);
    if (spec) {
      const { status, hasPlan } = specStatus(spec);
      lines.push(`Spec: ${spec} (status: ${status}${hasPlan ? ", plan present" : ", no plan section yet"})`);
    } else {
      lines.push("No spec found for this id. `/sdlc:spec` writes one.");
    }
    const item = findFile("docs/tracker", id);
    if (item) lines.push(`Tracker item: ${item}`);
  }

  if (!lines.length) return;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          "SDLC kit context:\n" +
          lines.map((l) => `- ${l}`).join("\n") +
          "\n- `/sdlc:status` shows the stage and the next action.",
      },
    })
  );
}

try {
  main();
} catch {
  // Orientation is a convenience; never fail a session start over it.
}
process.exit(0);
