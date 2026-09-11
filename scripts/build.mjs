#!/usr/bin/env node
// Render adapters/<tool>/ from src/.
//
// src/ is the single source of truth. The adapters are generated and
// committed, so `marketplace add` works straight from a clone with no build
// step - but that means they can go stale. `--check` fails when they have,
// which is what CI and the validator run.
//
//   node scripts/build.mjs            # write adapters/
//   node scripts/build.mjs --check    # exit 1 if adapters/ differ from src/
//
// Source files may use two build constructs:
//
//   {{CMD:sdlc:spec}}   {{AGENT:code-reviewer}}   {{MEMORY}}
//   {{ARGS}}            {{PLUGIN_ROOT}}           {{TOOL}}
//
//   <!-- if:claude -->  ...only in the Claude adapter...  <!-- endif -->
//   <!-- if:codex -->   ...only in the Codex adapter...   <!-- endif -->

import {
  existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = join(ROOT, "src");
const CHECK = process.argv.includes("--check");

const manifest = JSON.parse(readFileSync(join(SRC, "manifest.json"), "utf8"));

// --- adapters ---------------------------------------------------------------

const ADAPTERS = {
  claude: {
    dir: "adapters/claude",
    marketplacePath: ".claude-plugin/marketplace.json",
    pluginManifestDir: ".claude-plugin",
    tokens: {
      CMD: (plugin, name) => `/${plugin}:${name}`,
      AGENT: (name) => `\`${name}\` agent`,
      MEMORY: () => "CLAUDE.md",
      ARGS: () => "$ARGUMENTS",
      PLUGIN_ROOT: () => "${CLAUDE_PLUGIN_ROOT}",
      SETTINGS: () => ".claude/settings.json",
      TOOL: () => "Claude Code",
    },
  },
  codex: {
    dir: "adapters/codex",
    marketplacePath: ".agents/plugins/marketplace.json",
    pluginManifestDir: ".codex-plugin",
    tokens: {
      // Codex has no slash commands: each procedure becomes a skill.
      CMD: (plugin, name) => `the \`${plugin}-${name}\` skill`,
      // Codex has no subagent dispatch: roles are reference files.
      AGENT: (name) => `\`${name}\` role (references/agents/${name}.md)`,
      MEMORY: () => "AGENTS.md",
      ARGS: () => "the user's request",
      PLUGIN_ROOT: () => ".",
      SETTINGS: () => "~/.codex/config.toml",
      TOOL: () => "Codex",
    },
  },
};

// --- rendering --------------------------------------------------------------

function applyConditionals(text, adapter) {
  return text.replace(
    /[ \t]*<!--\s*if:([a-z]+)\s*-->\r?\n?([\s\S]*?)[ \t]*<!--\s*endif\s*-->\r?\n?/g,
    (_m, target, body) => (target === adapter ? body : "")
  );
}

function applyTokens(text, adapter) {
  const t = ADAPTERS[adapter].tokens;
  return text
    .replace(/\{\{CMD:([a-z]+):([a-z-]+)\}\}/g, (_m, p, n) => t.CMD(p, n))
    .replace(/\{\{AGENT:([a-z-]+)\}\}/g, (_m, n) => t.AGENT(n))
    .replace(/\{\{MEMORY\}\}/g, t.MEMORY())
    .replace(/\{\{ARGS\}\}/g, t.ARGS())
    .replace(/\{\{PLUGIN_ROOT\}\}/g, t.PLUGIN_ROOT())
    .replace(/\{\{SETTINGS\}\}/g, t.SETTINGS())
    .replace(/\{\{TOOL\}\}/g, t.TOOL());
}

function render(text, adapter) {
  return applyTokens(applyConditionals(text, adapter), adapter);
}

function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: null, raw: "", body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, raw: m[1], body: m[2] };
}

function stamp(srcRel) {
  return `<!-- Generated from src/${srcRel} by scripts/build.mjs. Edit the source, not this file. -->\n`;
}

function withStamp(text, srcRel) {
  const m = text.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
  if (!m) return stamp(srcRel) + "\n" + text;
  return `${m[1]}\n${stamp(srcRel)}${m[2].replace(/^\n+/, "\n")}`;
}

// --- output collection ------------------------------------------------------

/** @type {Map<string,string>} relative path -> content */
const out = new Map();
const emit = (relPath, content) => out.set(relPath.replace(/\\/g, "/"), content);

function walk(dir, base = dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, base, acc);
    else acc.push(relative(base, p).replace(/\\/g, "/"));
  }
  return acc;
}

const firstSentence = (description) =>
  description.split("\\n")[0].trim();

// --- per-adapter build ------------------------------------------------------

function buildClaudePlugin(plugin) {
  const base = `${ADAPTERS.claude.dir}/${plugin.name}`;

  emit(`${base}/.claude-plugin/plugin.json`, JSON.stringify({
    name: plugin.name,
    version: manifest.version,
    description: plugin.description,
    author: manifest.marketplace.owner,
    keywords: plugin.keywords,
  }, null, 2) + "\n");

  if (plugin.readme) {
    const src = join(SRC, plugin.readme);
    emit(`${base}/README.md`, stamp(plugin.readme) + "\n" + render(readFileSync(src, "utf8"), "claude"));
  }

  for (const name of plugin.skills) {
    const dir = join(SRC, "skills", name);
    for (const rel of walk(dir)) {
      const text = render(readFileSync(join(dir, rel), "utf8"), "claude");
      emit(`${base}/skills/${name}/${rel}`, rel === "SKILL.md" ? withStamp(text, `skills/${name}/${rel}`) : text);
    }
  }

  for (const name of plugin.agents) {
    const rel = `agents/${name}.md`;
    const text = render(readFileSync(join(SRC, rel), "utf8"), "claude");
    emit(`${base}/${rel}`, withStamp(text, rel));
  }

  if (plugin.commands) {
    const dir = join(SRC, "commands", plugin.commands);
    for (const rel of walk(dir)) {
      const text = render(readFileSync(join(dir, rel), "utf8"), "claude");
      emit(`${base}/commands/${rel}`, withStamp(text, `commands/${plugin.commands}/${rel}`));
    }
  }

  if (plugin.hooks) {
    const dir = join(SRC, "hooks");
    for (const rel of walk(dir)) emit(`${base}/hooks/${rel}`, readFileSync(join(dir, rel), "utf8"));
  }

  for (const s of plugin.scripts ?? []) {
    emit(`${base}/scripts/${s}`, readFileSync(join(SRC, "scripts", s), "utf8"));
  }
}

function buildCodexPlugin(plugin) {
  const base = `${ADAPTERS.codex.dir}/${plugin.name}`;

  emit(`${base}/.codex-plugin/plugin.json`, JSON.stringify({
    name: plugin.name,
    version: manifest.version,
    description: plugin.description,
    author: manifest.marketplace.owner,
    keywords: plugin.keywords,
    interface: {
      displayName: plugin.displayName,
      shortDescription: plugin.description.split(".")[0] + ".",
      longDescription: plugin.description,
      developerName: manifest.marketplace.owner.name,
      category: plugin.category,
      capabilities: ["Read", "Write", "Interactive"],
    },
    skills: "./skills/",
  }, null, 2) + "\n");

  if (plugin.readme) {
    const src = join(SRC, plugin.readme);
    emit(`${base}/README.md`, stamp(plugin.readme) + "\n" + render(readFileSync(src, "utf8"), "codex"));
  }

  // Skills carry only name + description: that is the whole Codex contract.
  for (const name of plugin.skills) {
    const dir = join(SRC, "skills", name);
    for (const rel of walk(dir)) {
      const raw = readFileSync(join(dir, rel), "utf8");
      if (rel !== "SKILL.md") {
        emit(`${base}/skills/${name}/${rel}`, render(raw, "codex"));
        continue;
      }
      const { meta, body } = splitFrontmatter(raw);
      const fm = `---\nname: ${meta.name}\ndescription: ${render(meta.description, "codex")}\n---\n`;
      emit(`${base}/skills/${name}/SKILL.md`, fm + "\n" + stamp(`skills/${name}/SKILL.md`) + render(body, "codex").replace(/^\n+/, "\n"));
    }
  }

  // Commands have no Codex equivalent, so each becomes a skill named
  // <plugin>-<command>. The description is what makes it fire.
  if (plugin.commands) {
    const dir = join(SRC, "commands", plugin.commands);
    for (const rel of walk(dir)) {
      const { meta, body } = splitFrontmatter(readFileSync(join(dir, rel), "utf8"));
      const cmd = rel.replace(/\.md$/, "");
      const skillName = `${plugin.name}-${cmd}`;
      const desc = render(meta.description, "codex").replace(/\s*$/, "").replace(/([^.!?])$/, "$1.");
      const fm = `---\nname: ${skillName}\ndescription: ${desc} Use when the user asks for the ${plugin.name} "${cmd}" step by name, or reaches that stage of the SDLC loop.\n---\n`;
      emit(
        `${base}/skills/${skillName}/SKILL.md`,
        fm + "\n" + stamp(`commands/${plugin.commands}/${rel}`) + render(body, "codex").replace(/^\n+/, "\n")
      );
    }
  }

  // Agents become reference roles: Codex has no subagent dispatch, so these
  // are run as a separate `codex exec` pass when a clean context matters.
  for (const name of plugin.agents) {
    const { meta, body } = splitFrontmatter(readFileSync(join(SRC, "agents", `${name}.md`), "utf8"));
    const header =
      `# Role: ${name}\n\n` +
      stamp(`agents/${name}.md`) +
      `\n**When to use:** ${render(firstSentence(meta.description), "codex")}\n\n` +
      `**Allowed tools (enforce by judgement - Codex has no per-role tool gate):** ${meta.tools ?? "all"}\n\n` +
      `Run this in its own \`codex exec\` pass when the job benefits from a clean context, ` +
      `or adopt the rules below inline for a small change.\n\n---\n`;
    emit(`${base}/references/agents/${name}.md`, header + render(body, "codex"));
  }

  for (const s of plugin.scripts ?? []) {
    emit(`${base}/scripts/${s}`, readFileSync(join(SRC, "scripts", s), "utf8"));
  }
}

// --- marketplaces -----------------------------------------------------------

function buildMarketplaces() {
  emit(ADAPTERS.claude.marketplacePath, JSON.stringify({
    $schema: "https://anthropic.com/claude-code/marketplace.schema.json",
    name: manifest.marketplace.name,
    description: manifest.marketplace.description,
    owner: manifest.marketplace.owner,
    plugins: manifest.plugins.map((p) => ({
      name: p.name,
      description: p.description,
      category: p.category,
      source: `./${ADAPTERS.claude.dir}/${p.name}`,
    })),
  }, null, 2) + "\n");

  emit(ADAPTERS.codex.marketplacePath, JSON.stringify({
    name: manifest.marketplace.name,
    interface: { displayName: manifest.marketplace.displayName },
    plugins: manifest.plugins.map((p) => ({
      name: p.name,
      source: { source: "local", path: `./${ADAPTERS.codex.dir}/${p.name}` },
      policy: { installation: "AVAILABLE" },
      category: p.category,
    })),
  }, null, 2) + "\n");
}

// --- run --------------------------------------------------------------------

for (const plugin of manifest.plugins) {
  buildClaudePlugin(plugin);
  buildCodexPlugin(plugin);
}
buildMarketplaces();

const OWNED = ["adapters", ".claude-plugin", ".agents"];

if (CHECK) {
  const onDisk = new Set();
  for (const dir of OWNED) {
    for (const rel of walk(join(ROOT, dir))) onDisk.add(`${dir}/${rel}`);
  }

  const problems = [];
  for (const [rel, content] of out) {
    if (!onDisk.has(rel)) { problems.push(`missing:  ${rel}`); continue; }
    if (readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n") !== content.replace(/\r\n/g, "\n")) {
      problems.push(`stale:    ${rel}`);
    }
    onDisk.delete(rel);
  }
  for (const rel of onDisk) problems.push(`orphaned: ${rel}`);

  if (problems.length) {
    for (const p of problems) process.stdout.write(`${p}\n`);
    process.stdout.write(`\nFAIL  adapters/ is out of date with src/ (${problems.length} problem(s)). Run: node scripts/build.mjs\n`);
    process.exit(1);
  }
  process.stdout.write(`OK  adapters/ match src/ (${out.size} files)\n`);
  process.exit(0);
}

for (const dir of OWNED) rmSync(join(ROOT, dir), { recursive: true, force: true });
for (const [rel, content] of out) {
  const dest = join(ROOT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content, "utf8");
}

const byAdapter = (name) => [...out.keys()].filter((k) => k.startsWith(`adapters/${name}/`)).length;
process.stdout.write(
  `Built ${out.size} files from src/\n` +
  `  adapters/claude: ${byAdapter("claude")}\n` +
  `  adapters/codex:  ${byAdapter("codex")}\n`
);
