#!/usr/bin/env node
// Shared installer behind the Bash and PowerShell entry points.
import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const kit = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
let target = ".", tool = "claude", templates = false, force = false, dry = false;
function fail(message) { throw new Error(message); }
try {
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--tool": tool = args[++i]; break;
      case "--templates": templates = true; break;
      case "--force": force = true; break;
      case "--dry-run": dry = true; break;
      case "--help": case "-h":
        console.log("node scripts/install.mjs <existing-target> [--tool claude|codex] [--templates] [--force] [--dry-run]");
        process.exit(0);
      default:
        if (args[i].startsWith("-")) fail(`Unknown option: ${args[i]}`);
        target = args[i];
    }
  }
  if (!["claude", "codex"].includes(tool)) fail("--tool must be claude or codex");
  target = realpathSync(target);
  if (target === realpathSync(kit)) fail("Refusing to install the kit into itself");
  const files = new Map();
  function add(source, dest, plugin) {
    if (files.has(dest)) fail(`Conflicting install destination: ${dest}`);
    let content = readFileSync(join(kit, source), "utf8");
    if (tool === "claude" && plugin && /\.md$/.test(source)) {
      content = content.replaceAll("${CLAUDE_PLUGIN_ROOT}", `.claude/plugins/${plugin}`);
    }
    files.set(dest, content);
  }
  function tree(source, dest, plugin) {
    if (!existsSync(join(kit, source))) return;
    for (const entry of readdirSync(join(kit, source), { withFileTypes: true })) {
      if (entry.isDirectory()) tree(`${source}/${entry.name}`, `${dest}/${entry.name}`, plugin);
      else if (entry.isFile()) add(`${source}/${entry.name}`, `${dest}/${entry.name}`, plugin);
      else fail(`Unsupported source entry: ${source}/${entry.name}`);
    }
  }
  for (const plugin of ["sdlc", "tracker"]) {
    const base = `adapters/${tool}/${plugin}`;
    if (!existsSync(join(kit, base))) fail(`${base} is missing; run node scripts/build.mjs`);
    if (tool === "claude") {
      for (const part of ["agents", "skills", "hooks"]) tree(`${base}/${part}`, `.claude/${part}`, plugin);
      tree(`${base}/commands`, `.claude/commands/${plugin}`, plugin);
      tree(`${base}/scripts`, `.claude/plugins/${plugin}/scripts`, plugin);
    } else {
      for (const part of ["skills", "references", "scripts"]) tree(`${base}/${part}`, `.agents/${part}`, plugin);
    }
  }
  add("LICENSE", ".sdlc/LICENSE");
  if (templates) {
    for (const name of ["AGENTS.md", "CLAUDE.md"]) add(`templates/${name}`, name);
    tree("templates/git-hooks", ".githooks");
    tree("templates/.github", ".github");
    tree("templates/docs", "docs");
    add("src/skills/spec-writing/references/spec-template.md", "docs/specs/SPEC-template.md");
    add("src/skills/adr-writing/references/adr-template.md", "docs/adr/ADR-template.md");
    if (tool === "claude") add("templates/settings.json", ".claude/settings.json");
  }
  // Preflight every destination before writing any file. Never follow a target
  // symlink/junction, including when --force would otherwise overwrite it.
  for (const dest of files.keys()) {
    let current = target;
    for (const part of dest.split("/")) {
      current = join(current, part);
      const stat = lstatSync(current, { throwIfNoEntry: false });
      if (stat?.isSymbolicLink()) fail(`Refusing symlink/junction destination: ${dest}`);
    }
    const rel = relative(target, resolve(target, dest));
    if (rel === ".." || rel.startsWith(`..${sep}`)) fail(`Destination escapes target: ${dest}`);
  }
  let copied = 0, skipped = 0;
  for (const [dest, content] of files) {
    const path = join(target, dest);
    if (existsSync(path) && !force) { console.log(`skip    ${dest}`); skipped++; continue; }
    console.log(`${dry ? "would" : "install"} ${dest}`);
    if (!dry) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, "utf8");
      if (dest === ".githooks/pre-commit") chmodSync(path, 0o755);
    }
    copied++;
  }
  console.log(`${copied} file(s) ${dry ? "planned" : "installed"}, ${skipped} skipped.`);
  console.log(tool === "claude" ? "Restart Claude Code in the target project; run /sdlc:onboard and /tracker:setup local from the project root." : "Start a fresh Codex session in the target project; use sdlc-onboard and tracker-setup.");
  if (templates) console.log("Review the installed settings, then activate the git guard: git config core.hooksPath .githooks");
  if (skipped) console.log("Existing files were preserved. Review and merge updates, or use --force only for files you intend to replace.");
} catch (error) {
  console.error(`install: ${error.message}`);
  process.exit(1);
}
