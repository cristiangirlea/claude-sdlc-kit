#!/usr/bin/env node
// Scan staged blobs, never the working copy. Messages omit credential values.
import { execFileSync } from "node:child_process";

const git = args => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
const patterns = [
  /(?:AKIA|ASIA)[0-9A-Z]{16}/,
  /gh[pousr]_[A-Za-z0-9]{36}/,
  /github_pat_[A-Za-z0-9_]{50,}/,
  /sk-(?:(?:proj|svcacct|ant)-)?[A-Za-z0-9_-]{32,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/,
  /AIza[0-9A-Za-z_-]{35}/,
];
function forbidden(path) {
  const name = path.split("/").at(-1);
  if (/^\.env(?:\.|$)/i.test(name) && !/^\.env\.(example|sample|template)$/i.test(name)) return true;
  return /(^|\/)(id_(rsa|dsa|ecdsa|ed25519)|\.netrc)$|\.(pem|key|p12|pfx|keystore|jks)$|(^|\/)(credentials|secrets?)\.(json|ya?ml|toml|ini)$|(^|\/)(service-account|gcp-key)[^/]*\.json$|(^|\/)\.(aws|ssh|gnupg)\//i.test(path);
}
try {
  const paths = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]).split("\0").filter(Boolean);
  let failed = false;
  for (const path of paths) {
    const content = git(["show", `:${path}`]);
    const reasons = [];
    if (forbidden(path)) reasons.push("sensitive filename; use an example file with placeholders");
    if (patterns.some(pattern => pattern.test(content))) reasons.push("credential or private-key pattern in staged content");
    if (/^(<<<<<<< |>>>>>>> )/m.test(content)) reasons.push("unresolved merge conflict");
    if (reasons.length) {
      console.error(`pre-commit: ${JSON.stringify(path)}: ${reasons.join("; ")}`);
      failed = true;
    }
  }
  if (failed) {
    console.error("Commit refused. Fix the staged content. This limited local check can be bypassed with --no-verify; it is not a security boundary.");
    process.exit(1);
  }
} catch {
  console.error("pre-commit: unable to read the staged content; commit refused. Check Git and Node.js availability and file size.");
  process.exit(1);
}
