#!/usr/bin/env node
// Structural validator for this kit.
//
// Catches the mistakes that make a plugin silently not load: malformed
// frontmatter, a skill whose `name` disagrees with its directory, a hook
// pointing at a script that does not exist, unparseable JSON manifests.
//
// Run from the repo root:  node scripts/validate-kit.mjs
// Exit code 0 = clean, 1 = errors found. Warnings do not fail the run.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const ROOT = resolve(process.argv[2] ?? ".");
const errors = [];
const warnings = [];
const counts = { plugins: 0, agents: 0, skills: 0, commands: 0, hooks: 0 };

const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, "/");

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    err(rel(path), `invalid JSON - ${e.message}`);
    return null;
  }
}

// Minimal frontmatter reader: `key: value` pairs, tolerant of block scalars.
function frontmatter(path) {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!m) return null;
  const meta = {};
  let currentKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (kv) {
      currentKey = kv[1];
      meta[currentKey] = kv[2].trim();
    } else if (currentKey && /^\s+\S/.test(line)) {
      meta[currentKey] = `${meta[currentKey]} ${line.trim()}`.trim();
    }
  }
  return meta;
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => join(dir, f));
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((f) => join(dir, f))
    .filter((p) => statSync(p).isDirectory());
}

const DESC_MAX = 1024;

function checkNamed(path, kind, expectedName) {
  const meta = frontmatter(path);
  if (!meta) {
    err(rel(path), `${kind} has no YAML frontmatter block`);
    return null;
  }
  if (!meta.name) err(rel(path), `${kind} frontmatter is missing \`name\``);
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.name))
    err(rel(path), `name "${meta.name}" must be lowercase kebab-case`);
  else if (expectedName && meta.name !== expectedName)
    err(rel(path), `name "${meta.name}" does not match "${expectedName}"`);

  if (!meta.description) err(rel(path), `${kind} frontmatter is missing \`description\``);
  else {
    if (meta.description.length > DESC_MAX)
      err(rel(path), `description is ${meta.description.length} chars (max ${DESC_MAX})`);
    if (meta.description.length < 40)
      warn(rel(path), "description is very short - it is what triggers the skill/agent, so say when to use it");
  }
  return meta;
}

// --- manifests --------------------------------------------------------------

const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json");
let marketplace = null;
if (!existsSync(marketplacePath)) {
  err(".claude-plugin/marketplace.json", "missing");
} else {
  marketplace = readJson(marketplacePath);
  if (marketplace) {
    if (!marketplace.name) err(rel(marketplacePath), "missing `name`");
    if (!Array.isArray(marketplace.plugins) || !marketplace.plugins.length)
      err(rel(marketplacePath), "`plugins` must be a non-empty array");
  }
}

const pluginDirs = listDirs(join(ROOT, "plugins"));
if (!pluginDirs.length) err("plugins/", "no plugin directories found");

// Every plugin listed in the marketplace must exist, and vice versa.
if (marketplace?.plugins) {
  for (const p of marketplace.plugins) {
    const src = typeof p.source === "string" ? p.source : p.source?.path;
    if (!src) {
      warn(rel(marketplacePath), `plugin "${p.name}" has a non-local source; not checked`);
      continue;
    }
    if (!existsSync(join(ROOT, src)))
      err(rel(marketplacePath), `plugin "${p.name}" points at ${src}, which does not exist`);
  }
  const listed = new Set(marketplace.plugins.map((p) => p.name));
  for (const d of pluginDirs) {
    if (!listed.has(basename(d)))
      warn("plugins/", `${basename(d)} is not listed in marketplace.json`);
  }
}

// --- per plugin -------------------------------------------------------------

for (const pluginDir of pluginDirs) {
  const pluginName = basename(pluginDir);
  counts.plugins += 1;

  const manifestPath = join(pluginDir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    err(`plugins/${pluginName}`, "missing .claude-plugin/plugin.json");
  } else {
    const manifest = readJson(manifestPath);
    if (manifest) {
      if (manifest.name !== pluginName)
        err(rel(manifestPath), `name "${manifest.name}" does not match directory "${pluginName}"`);
      if (!manifest.description) err(rel(manifestPath), "missing `description`");
    }
  }

  // agents
  for (const f of listFiles(join(pluginDir, "agents"), ".md")) {
    counts.agents += 1;
    const meta = checkNamed(f, "agent", basename(f, ".md"));
    if (meta && meta.tools) {
      const known = new Set([
        "Read", "Write", "Edit", "MultiEdit", "NotebookEdit", "Bash", "Glob",
        "Grep", "Task", "TodoWrite", "WebFetch", "WebSearch", "Artifact",
      ]);
      for (const t of meta.tools.split(/[,\s]+/).filter(Boolean)) {
        if (!known.has(t)) warn(rel(f), `unrecognised tool "${t}" in \`tools\``);
      }
    }
    if (meta && meta.model && !["inherit", "opus", "sonnet", "haiku"].includes(meta.model))
      warn(rel(f), `unusual model "${meta.model}"`);
  }

  // skills
  for (const dir of listDirs(join(pluginDir, "skills"))) {
    const skillFile = join(dir, "SKILL.md");
    if (!existsSync(skillFile)) {
      err(rel(dir), "skill directory has no SKILL.md");
      continue;
    }
    counts.skills += 1;
    checkNamed(skillFile, "skill", basename(dir));

    // Referenced files must exist.
    const body = readFileSync(skillFile, "utf8");
    for (const m of body.matchAll(/`(references\/[A-Za-z0-9._/-]+)`/g)) {
      if (!existsSync(join(dir, m[1]))) err(rel(skillFile), `references missing file ${m[1]}`);
    }
    for (const m of body.matchAll(/\]\((references\/[A-Za-z0-9._/-]+)\)/g)) {
      if (!existsSync(join(dir, m[1]))) err(rel(skillFile), `links to missing file ${m[1]}`);
    }
  }

  // commands
  for (const f of listFiles(join(pluginDir, "commands"), ".md")) {
    counts.commands += 1;
    const meta = frontmatter(f);
    if (!meta) {
      err(rel(f), "command has no YAML frontmatter block");
      continue;
    }
    if (!meta.description) err(rel(f), "command frontmatter is missing `description`");
    if (meta["allowed-tools"] && !/^\[|^[A-Za-z]/.test(meta["allowed-tools"]))
      warn(rel(f), "`allowed-tools` should be a JSON array or a comma-separated list");
  }

  // hooks
  const hooksPath = join(pluginDir, "hooks", "hooks.json");
  if (existsSync(hooksPath)) {
    const hooks = readJson(hooksPath);
    if (hooks) {
      if (!hooks.hooks || typeof hooks.hooks !== "object")
        err(rel(hooksPath), "expected a top-level `hooks` object");
      const text = JSON.stringify(hooks);
      for (const m of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([A-Za-z0-9._/-]+)/g)) {
        if (!existsSync(join(pluginDir, m[1])))
          err(rel(hooksPath), `hook command points at missing file ${m[1]}`);
      }
    }
  }
}

// --- hook scripts parse -----------------------------------------------------

for (const pluginDir of pluginDirs) {
  for (const f of listFiles(join(pluginDir, "hooks"), ".mjs")) {
    counts.hooks += 1;
    const src = readFileSync(f, "utf8");
    if (!/process\.exit\(0\)/.test(src))
      warn(rel(f), "hook does not appear to exit 0 unconditionally - a hook bug should never block work");
  }
}

// --- report -----------------------------------------------------------------

const label = rel(ROOT) || basename(ROOT);
for (const w of warnings) process.stdout.write(`warn  ${w}\n`);
for (const e of errors) process.stdout.write(`ERROR ${e}\n`);

process.stdout.write(
  `\nChecked ${counts.plugins} plugin(s): ${counts.agents} agents, ${counts.skills} skills, ` +
    `${counts.commands} commands, ${counts.hooks} hook scripts\n` +
    `${errors.length ? "FAIL" : "OK"}  ${label}: ${errors.length} error(s), ${warnings.length} warning(s)\n`
);
process.exit(errors.length ? 1 : 0);
