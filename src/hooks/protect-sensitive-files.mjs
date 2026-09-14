#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit|NotebookEdit) guard.
//
// Denies writes to files that hold real credentials or that no automated edit
// should touch (lockfiles are excluded from that list on purpose - dependency
// updates are legitimate work and the diff is reviewable).
//
// Always exits 0; a deny is expressed as JSON on stdout.

import { readFileSync } from "node:fs";

const DENY = [
  { re: /(^|[\\/])\.env(?=$|\.)(?!\.(?:example|sample|template)$)/i, why: "`.env` files hold real secrets. Edit `.env.example` with placeholder values instead, and ask the user to set the real value themselves." },
  { re: /(^|[\\/])(id_rsa|id_ed25519|id_ecdsa)(\.pub)?$/i, why: "SSH key material." },
  { re: /\.(pem|key|p12|pfx|keystore|jks)$/i, why: "Private key or certificate store." },
  { re: /(^|[\\/])\.(aws|ssh|gnupg)[\\/]/i, why: "Credential directory." },
  { re: /(^|[\\/])(credentials|secrets?)\.(json|ya?ml|toml|ini)$/i, why: "Credential file." },
  { re: /(^|[\\/])\.netrc$/i, why: "Credential file." },
  { re: /(^|[\\/])(service-account|gcp-key)[^\\/]*\.json$/i, why: "Cloud service-account key." },
];

function targetPaths(payload) {
  const input = payload.tool_input ?? {};
  const paths = [];
  if (typeof input.file_path === "string") paths.push(input.file_path);
  if (typeof input.notebook_path === "string") paths.push(input.notebook_path);
  if (Array.isArray(input.edits)) {
    for (const e of input.edits) {
      if (typeof e?.file_path === "string") paths.push(e.file_path);
    }
  }
  return paths;
}

function main() {
  let raw = "";
  try {
    raw = readFileSync(0, "utf8");
  } catch {
    return;
  }
  if (!raw.trim()) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  for (const p of targetPaths(payload)) {
    const normalized = p.replace(/\\/g, "/");
    const hit = DENY.find((d) => d.re.test(normalized));
    if (hit) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason:
              `Blocked by the sdlc kit's sensitive-file guard: ${p}\n${hit.why}\n` +
              `Tell the user what needs to change and let them edit this file themselves.`,
          },
        })
      );
      return;
    }
  }
}

try {
  main();
} catch {
  // Never block on an internal error.
}
process.exit(0);
