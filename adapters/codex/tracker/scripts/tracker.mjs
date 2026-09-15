#!/usr/bin/env node
// Local file-backed issue tracker.
//
// One markdown file per work item under `docs/tracker/`, with simple
// JSON-quoted string frontmatter (legacy plain strings remain readable).
// Plain files on purpose: they diff, they review,
// they survive without a service, and they are readable by a human and an
// agent alike.
//
// Usage:
//   node tracker.mjs list [--status <s>] [--type <t>] [--json]
//   node tracker.mjs show <id>
//   node tracker.mjs new "<title>" [--type feature|bug|chore] [--priority P1..P4] [--status backlog]
//   node tracker.mjs move <id> <status>
//   node tracker.mjs set <id> <key>=<value> [<key>=<value> ...]
//   node tracker.mjs comment <id> "<text>"
//   node tracker.mjs report [--days 7]
//   node tracker.mjs next
//
// Config (optional): .sdlc/tracker.json
//   { "backend": "local", "prefix": "TASK", "dir": "docs/tracker" }

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STATUSES = [
  "backlog",
  "ready",
  "in-progress",
  "in-review",
  "blocked",
  "done",
];
const TYPES = ["feature", "bug", "chore", "spike"];
const PRIORITIES = ["P1", "P2", "P3", "P4"];

const cliArgs = process.argv.slice(2);
const rootIndex = cliArgs.indexOf("--root");
let projectRoot = process.cwd();
if (rootIndex !== -1) {
  const value = cliArgs[rootIndex + 1];
  if (!value || value.startsWith("--")) fail("--root needs a project directory");
  projectRoot = resolve(value);
  cliArgs.splice(rootIndex, 2);
}
const ROOT = resolve(projectRoot);
if (!existsSync(ROOT)) fail("project root does not exist");
const resourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (ROOT === resourceRoot && (existsSync(join(ROOT, ".codex-plugin")) || existsSync(join(ROOT, ".claude-plugin")))) {
  fail("run from your project directory, or pass --root <project>; do not store issues in the plugin");
}

function loadConfig() {
  const defaults = { backend: "local", prefix: "TASK", dir: "docs/tracker" };
  const p = join(ROOT, ".sdlc", "tracker.json");
  if (!existsSync(p)) return defaults;
  try {
    return { ...defaults, ...JSON.parse(readFileSync(p, "utf8")) };
  } catch (err) {
    fail(`.sdlc/tracker.json is not valid JSON: ${err.message}`);
  }
}

const config = loadConfig();
const DIR = join(ROOT, config.dir);

function fail(msg) {
  process.stderr.write(`tracker: ${msg}\n`);
  process.exit(1);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function parseItem(path) {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const quoted = m[1].split(/\r?\n/).includes("# sdlc-tracker-format: json-strings-v1");
  const meta = Object.create(null);
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      const value = kv[2].trim();
      // The marker distinguishes new encoded strings from literal legacy quotes.
      if (quoted) {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed !== "string") fail(`invalid string in ${basename(path)}: ${kv[1]}`);
          meta[kv[1]] = parsed;
        } catch { fail(`invalid quoted string in ${basename(path)}: ${kv[1]}`); }
      } else meta[kv[1]] = value;
    }
  }
  return { path, meta, body: m[2] };
}

function serialize(item) {
  const keys = [
    "id",
    "title",
    "status",
    "type",
    "priority",
    "assignee",
    "branch",
    "pr",
    "spec",
    "external",
    "created",
    "updated",
  ];
  const seen = new Set(keys);
  const ordered = [
    ...keys.filter((k) => item.meta[k] !== undefined),
    ...Object.keys(item.meta).filter((k) => !seen.has(k)),
  ];
  const fm = ordered.map((k) => `${k}: ${JSON.stringify(item.meta[k] ?? "")}`).join("\n");
  return `---\n# sdlc-tracker-format: json-strings-v1\n${fm}\n---\n${item.body.replace(/^\n*/, "\n")}`;
}

function allItems() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map((f) => parseItem(join(DIR, f)))
    .filter((i) => i && i.meta.id)
    .sort((a, b) => a.meta.id.localeCompare(b.meta.id, undefined, { numeric: true }));
}

function findItem(id) {
  const wanted = String(id).toUpperCase();
  const items = allItems();
  const hit =
    items.find((i) => i.meta.id.toUpperCase() === wanted) ||
    items.find((i) => basename(i.path).toUpperCase().startsWith(wanted + "-"));
  if (!hit) fail(`no item with id ${id}`);
  return hit;
}

function nextId() {
  const prefix = config.prefix;
  const nums = allItems()
    .map((i) => {
      const m = i.meta.id.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
      return m ? Number(m[1]) : 0;
    })
    .filter(Boolean);
  return `${prefix}-${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function appendLog(item, line) {
  const entry = `- ${today()} ${line}`;
  if (/^##\s+Log\s*$/m.test(item.body)) {
    item.body = item.body.replace(/^##\s+Log\s*$/m, `## Log\n${entry}`);
  } else {
    item.body = `${item.body.replace(/\s*$/, "")}\n\n## Log\n${entry}\n`;
  }
}

function save(item) {
  item.meta.updated = today();
  writeFileSync(item.path, serialize(item), "utf8");
}

function flag(args, name, fallback = "") {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) fail(`--${name} needs a value`);
  return v;
}

// --- commands ---------------------------------------------------------------

function cmdList(args) {
  let items = allItems();
  const status = flag(args, "status");
  const type = flag(args, "type");
  if (status) items = items.filter((i) => i.meta.status === status);
  if (type) items = items.filter((i) => i.meta.type === type);

  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify(items.map((i) => i.meta), null, 2) + "\n");
    return;
  }
  if (!items.length) {
    process.stdout.write("No items.\n");
    return;
  }
  const w = Math.max(...items.map((i) => i.meta.id.length));
  for (const i of items) {
    process.stdout.write(
      `${i.meta.id.padEnd(w)}  ${(i.meta.status || "?").padEnd(11)}  ${(i.meta.priority || "  ").padEnd(2)}  ${i.meta.title}\n`
    );
  }
}

function cmdShow(args) {
  const item = findItem(args[0] || fail("show needs an id"));
  process.stdout.write(readFileSync(item.path, "utf8"));
}

function cmdNew(args) {
  const title = args.find((a) => !a.startsWith("--"));
  if (!title || !title.trim()) fail('new needs a title: tracker.mjs new "Add saved searches"');

  const type = flag(args, "type", "feature");
  if (!TYPES.includes(type)) fail(`type must be one of: ${TYPES.join(", ")}`);
  const status = flag(args, "status", "backlog");
  if (!STATUSES.includes(status)) fail(`status must be one of: ${STATUSES.join(", ")}`);
  const priority = flag(args, "priority", "P3");
  if (!PRIORITIES.includes(priority)) fail(`priority must be one of: ${PRIORITIES.join(", ")}`);

  mkdirSync(DIR, { recursive: true });
  const id = nextId();
  const path = join(DIR, `${id}-${slugify(title)}.md`);
  const item = {
    path,
    meta: {
      id,
      title,
      status,
      type,
      priority,
      assignee: "",
      branch: "",
      pr: "",
      spec: "",
      external: "",
      created: today(),
      updated: today(),
    },
    body: `
## Description

<what and why>

## Acceptance criteria

- AC1 - Given <state>, When <action>, Then <observable outcome>

## Notes

## Log
- ${today()} created (${status})
`,
  };
  writeFileSync(path, serialize(item), "utf8");
  process.stdout.write(`${id}\n${path}\n`);
}

function cmdMove(args) {
  const [id, status] = args;
  if (!id || !status) fail("move needs <id> <status>");
  if (!STATUSES.includes(status)) fail(`status must be one of: ${STATUSES.join(", ")}`);
  const item = findItem(id);
  const from = item.meta.status;
  if (from === status) {
    process.stdout.write(`${item.meta.id} already ${status}\n`);
    return;
  }
  item.meta.status = status;
  appendLog(item, `status ${from} -> ${status}`);
  save(item);
  process.stdout.write(`${item.meta.id}: ${from} -> ${status}\n`);
}

function cmdSet(args) {
  const [id, ...pairs] = args;
  if (!id || !pairs.length) fail("set needs <id> <key>=<value> ...");
  const item = findItem(id);
  const changes = [];
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq < 1) fail(`bad key=value: ${pair}`);
    const key = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(key) || ["constructor", "prototype"].includes(key)) fail(`invalid metadata key: ${key}`);
    if (["id", "created", "updated"].includes(key)) fail(`${key} is managed by the tracker and cannot be changed`);
    if (key === "status") fail("use `move` to change status so the log stays accurate");
    if (key === "priority" && !PRIORITIES.includes(value)) fail(`priority must be one of: ${PRIORITIES.join(", ")}`);
    if (key === "type" && !TYPES.includes(value)) fail(`type must be one of: ${TYPES.join(", ")}`);
    if (key === "title" && !value.trim()) fail("title must not be empty");
    changes.push(`${key}=${value}`);
    item.meta[key] = value;
  }
  appendLog(item, `set ${changes.join(" ")}`);
  save(item);
  process.stdout.write(`${item.meta.id} updated: ${changes.join(" ")}\n`);
}

function cmdComment(args) {
  const [id, ...rest] = args;
  const text = rest.join(" ").trim();
  if (!id || !text) fail('comment needs <id> "<text>"');
  const item = findItem(id);
  appendLog(item, text);
  save(item);
  process.stdout.write(`${item.meta.id}: comment added\n`);
}

function cmdReport(args) {
  const rawDays = flag(args, "days", "7");
  const days = Number(rawDays);
  if (!/^\d+$/.test(rawDays) || !Number.isSafeInteger(days) || days > 365000) fail("--days must be an integer between 0 and 365000");
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const items = allItems();
  const by = (s) => items.filter((i) => i.meta.status === s);

  const out = [];
  out.push(`Tracker report - last ${days} days (since ${cutoff})`);
  out.push("");
  for (const s of STATUSES) {
    const list = by(s);
    if (!list.length) continue;
    out.push(`${s} (${list.length})`);
    for (const i of list) out.push(`  ${i.meta.id}  ${i.meta.title}`);
    out.push("");
  }
  const touched = items.filter((i) => (i.meta.updated || "") >= cutoff);
  out.push(`Updated in window (${touched.length}):`);
  for (const i of touched) {
    out.push(`  ${i.meta.id}  ${i.meta.status.padEnd(11)}  ${i.meta.title}`);
  }
  const blocked = by("blocked");
  if (blocked.length) {
    out.push("");
    out.push("BLOCKED - needs a decision:");
    for (const i of blocked) out.push(`  ${i.meta.id}  ${i.meta.title}`);
  }
  process.stdout.write(out.join("\n") + "\n");
}

function cmdNext() {
  const items = allItems();
  const inProgress = items.filter((i) => i.meta.status === "in-progress");
  if (inProgress.length) {
    process.stdout.write(
      `Already in progress (finish or park these first):\n` +
        inProgress.map((i) => `  ${i.meta.id}  ${i.meta.title}`).join("\n") +
        "\n"
    );
    return;
  }
  const rank = { P1: 1, P2: 2, P3: 3, P4: 4 };
  const ready = items
    .filter((i) => i.meta.status === "ready")
    .sort((a, b) => (rank[a.meta.priority] ?? 9) - (rank[b.meta.priority] ?? 9));
  if (!ready.length) {
    process.stdout.write("Nothing in `ready`. Groom the backlog first.\n");
    return;
  }
  const i = ready[0];
  process.stdout.write(`${i.meta.id}  ${i.meta.priority}  ${i.meta.title}\n${i.path}\n`);
}

// --- entry ------------------------------------------------------------------

const [cmd, ...args] = cliArgs;
const commands = {
  list: cmdList,
  show: cmdShow,
  new: cmdNew,
  move: cmdMove,
  set: cmdSet,
  comment: cmdComment,
  report: cmdReport,
  next: cmdNext,
};

if (!cmd || cmd === "--help" || cmd === "-h" || !Object.hasOwn(commands, cmd)) {
  process.stdout.write(
    [
      "tracker - local file-backed issue tracker",
      "Global option: --root <project-directory> (default: current directory)",
      "",
      "  list [--status <s>] [--type <t>] [--json]",
      "  show <id>",
      '  new "<title>" [--type feature|bug|chore|spike] [--priority P1..P4] [--status backlog]',
      `  move <id> <${STATUSES.join("|")}>`,
      "  set <id> <key>=<value> ...",
      '  comment <id> "<text>"',
      "  report [--days 7]",
      "  next",
      "",
      `Items live in ${config.dir}/ (configure in .sdlc/tracker.json).`,
      "",
    ].join("\n")
  );
  process.exit(cmd && cmd !== "--help" && cmd !== "-h" && !Object.hasOwn(commands, cmd) ? 1 : 0);
}

commands[cmd](args);
