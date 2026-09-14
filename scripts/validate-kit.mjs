#!/usr/bin/env node
// Structural validator for the kit.
//
// Checks the SOURCE (src/) for the mistakes that make a plugin silently not
// load, checks the manifest actually claims every source file, checks the
// generated adapters are well formed, and finally that they are in sync with
// src/ - a stale adapter is the failure mode this layout introduces, so it is
// the one the validator mainly exists to catch.
//
//   node scripts/validate-kit.mjs
//
// Exit 0 = clean, 1 = errors. Warnings never fail the run.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { fileURLToPath } from "node:url";
import { splitFrontmatter } from "./frontmatter.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);
const counts = { skills: 0, agents: 0, commands: 0, hooks: 0, adapters: 0 };

const DESC_MAX = 1024;
const KNOWN_TOKENS = /^\{\{(CMD:[a-z]+:[a-z-]+|AGENT:[a-z-]+|MEMORY|ARGS|PLUGIN_ROOT|SETTINGS|TOOL)\}\}$/;

function readJson(relPath) {
  try {
    return JSON.parse(readFileSync(join(ROOT, relPath), "utf8"));
  } catch (e) {
    err(relPath, `invalid or missing JSON - ${e.message}`);
    return null;
  }
}

function frontmatter(path) {
  try { return splitFrontmatter(readFileSync(path, "utf8")).meta; }
  catch (error) { err(rel(path), error.message); return null; }
}

const listDirs = (d) => (existsSync(d) ? readdirSync(d).map((f) => join(d, f)).filter((p) => statSync(p).isDirectory()) : []);
const listFiles = (d, ext) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(ext)).map((f) => join(d, f)) : []);
const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, "/");

function checkBody(path) {
  const body = readFileSync(path, "utf8");

  for (const m of body.matchAll(/\{\{[^}\n]*\}\}/g)) {
    if (!KNOWN_TOKENS.test(m[0])) err(rel(path), `unknown build token ${m[0]}`);
  }

  const opens = [...body.matchAll(/<!--\s*if:([a-z]+)\s*-->/g)];
  const closes = [...body.matchAll(/<!--\s*endif\s*-->/g)];
  if (opens.length !== closes.length) {
    err(rel(path), `unbalanced conditional blocks: ${opens.length} if, ${closes.length} endif`);
  }
  for (const o of opens) {
    if (!["claude", "codex"].includes(o[1])) err(rel(path), `unknown adapter "${o[1]}" in conditional block`);
  }
  return body;
}

function checkNamed(path, kind, expected) {
  const meta = frontmatter(path);
  if (!meta) { err(rel(path), `${kind} has no YAML frontmatter block`); return null; }
  if (!meta.name) err(rel(path), `${kind} is missing \`name\``);
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.name)) err(rel(path), `name "${meta.name}" must be lowercase kebab-case`);
  else if (expected && meta.name !== expected) err(rel(path), `name "${meta.name}" does not match "${expected}"`);

  if (!meta.description) err(rel(path), `${kind} is missing \`description\``);
  else {
    if (meta.description.length > DESC_MAX) err(rel(path), `description is ${meta.description.length} chars (max ${DESC_MAX})`);
    if (meta.description.length < 40) warn(rel(path), "description is very short - it is the trigger, so say when to use it");
  }
  return meta;
}

// --- source -----------------------------------------------------------------

const manifest = readJson("src/manifest.json");

const srcSkills = listDirs(join(SRC, "skills")).map((d) => basename(d));
for (const name of srcSkills) {
  const dir = join(SRC, "skills", name);
  const file = join(dir, "SKILL.md");
  if (!existsSync(file)) { err(rel(dir), "skill directory has no SKILL.md"); continue; }
  counts.skills++;
  checkNamed(file, "skill", name);
  const body = checkBody(file);
  const refs = [...body.matchAll(/`(references\/[A-Za-z0-9._/-]+)`/g), ...body.matchAll(/\]\((references\/[A-Za-z0-9._/-]+)\)/g)];
  for (const m of refs) {
    if (!existsSync(join(dir, m[1]))) err(rel(file), `references missing file ${m[1]}`);
  }
}

const KNOWN_TOOLS = new Set(["Read", "Write", "Edit", "MultiEdit", "NotebookEdit", "Bash", "Glob", "Grep", "Task", "TodoWrite", "WebFetch", "WebSearch"]);
const srcAgents = listFiles(join(SRC, "agents"), ".md").map((f) => basename(f, ".md"));
for (const name of srcAgents) {
  const file = join(SRC, "agents", `${name}.md`);
  counts.agents++;
  const meta = checkNamed(file, "agent", name);
  checkBody(file);
  if (meta?.tools) {
    for (const t of meta.tools.split(/[,\s]+/).filter(Boolean)) {
      if (!KNOWN_TOOLS.has(t)) warn(rel(file), `unrecognised tool "${t}"`);
    }
  }
  if (meta?.model && !["inherit", "opus", "sonnet", "haiku"].includes(meta.model)) {
    warn(rel(file), `unusual model "${meta.model}"`);
  }
}

for (const group of listDirs(join(SRC, "commands"))) {
  for (const file of listFiles(group, ".md")) {
    counts.commands++;
    const meta = frontmatter(file);
    if (!meta) { err(rel(file), "command has no YAML frontmatter block"); continue; }
    if (!meta.description) err(rel(file), "command is missing `description`");
    checkBody(file);
  }
}

for (const file of listFiles(join(SRC, "hooks"), ".mjs")) {
  counts.hooks++;
  if (!/process\.exit\(0\)/.test(readFileSync(file, "utf8"))) {
    warn(rel(file), "hook does not exit 0 unconditionally - a hook bug must never block work");
  }
}

// --- manifest coverage ------------------------------------------------------

if (manifest) {
  const claimedSkills = new Set();
  const claimedAgents = new Set();
  for (const p of manifest.plugins ?? []) {
    for (const s of p.skills ?? []) {
      if (!srcSkills.includes(s)) err("src/manifest.json", `plugin "${p.name}" claims skill "${s}", which is not in src/skills/`);
      if (claimedSkills.has(s)) err("src/manifest.json", `skill "${s}" is claimed by more than one plugin`);
      claimedSkills.add(s);
    }
    for (const a of p.agents ?? []) {
      if (!srcAgents.includes(a)) err("src/manifest.json", `plugin "${p.name}" claims agent "${a}", which is not in src/agents/`);
      claimedAgents.add(a);
    }
    if (p.commands && !existsSync(join(SRC, "commands", p.commands))) {
      err("src/manifest.json", `plugin "${p.name}" points at commands/${p.commands}, which does not exist`);
    }
    for (const s of p.scripts ?? []) {
      if (!existsSync(join(SRC, "scripts", s))) err("src/manifest.json", `plugin "${p.name}" claims script "${s}", which does not exist`);
    }
    if (p.readme && !existsSync(join(SRC, p.readme))) {
      err("src/manifest.json", `plugin "${p.name}" readme "${p.readme}" does not exist`);
    }
  }
  for (const s of srcSkills) {
    if (!claimedSkills.has(s)) err("src/manifest.json", `skill "${s}" is claimed by no plugin - it would ship nowhere`);
  }
  for (const a of srcAgents) {
    if (!claimedAgents.has(a)) warn("src/manifest.json", `agent "${a}" is claimed by no plugin`);
  }
}

// --- generated adapters -----------------------------------------------------

const ADAPTERS = [
  { name: "claude", manifestDir: ".claude-plugin", marketplace: ".claude-plugin/marketplace.json" },
  { name: "codex", manifestDir: ".codex-plugin", marketplace: ".agents/plugins/marketplace.json" },
];

for (const a of ADAPTERS) {
  const dir = join(ROOT, "adapters", a.name);
  if (!existsSync(dir)) { err(`adapters/${a.name}`, "missing - run: node scripts/build.mjs"); continue; }
  counts.adapters++;

  const market = readJson(a.marketplace);
  if (market) {
    if (!(market.plugins ?? []).length) err(a.marketplace, "no plugins listed");
    for (const p of market.plugins ?? []) {
      const path = typeof p.source === "string" ? p.source : p.source?.path;
      if (!path || !existsSync(join(ROOT, path))) {
        err(a.marketplace, `plugin "${p.name}" points at ${path}, which does not exist`);
      }
    }
  }

  for (const pluginDir of listDirs(dir)) {
    const name = basename(pluginDir);
    const mf = join(pluginDir, a.manifestDir, "plugin.json");
    if (!existsSync(mf)) { err(rel(pluginDir), `missing ${a.manifestDir}/plugin.json`); continue; }
    const parsed = readJson(rel(mf));
    if (parsed && parsed.name !== name) err(rel(mf), `name "${parsed.name}" does not match directory "${name}"`);

    for (const skillDir of listDirs(join(pluginDir, "skills"))) {
      const f = join(skillDir, "SKILL.md");
      if (!existsSync(f)) { err(rel(skillDir), "skill directory has no SKILL.md"); continue; }
      checkNamed(f, "skill", basename(skillDir));
      for (const m of readFileSync(f, "utf8").matchAll(/\{\{[^}\n]*\}\}/g)) {
        err(rel(f), `unrendered build token ${m[0]} in generated output`);
      }
    }
  }
}

// --- adapters in sync with src ----------------------------------------------

try {
  execFileSync(process.execPath, [join(ROOT, "scripts", "build.mjs"), "--check"], { cwd: ROOT, stdio: "pipe" });
} catch (e) {
  const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.toString().trim();
  err("adapters/", `out of date with src/ - run: node scripts/build.mjs\n${out}`);
}

// --- report -----------------------------------------------------------------

for (const w of warnings) process.stdout.write(`warn  ${w}\n`);
for (const e of errors) process.stdout.write(`ERROR ${e}\n`);

process.stdout.write(
  `\nSource: ${counts.skills} skills, ${counts.agents} agents, ${counts.commands} commands, ` +
  `${counts.hooks} hook scripts -> ${counts.adapters} adapter(s)\n` +
  `${errors.length ? "FAIL" : "OK"}  ${errors.length} error(s), ${warnings.length} warning(s)\n`
);
process.exit(errors.length ? 1 : 0);
