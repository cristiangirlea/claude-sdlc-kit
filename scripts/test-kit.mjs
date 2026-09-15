#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { splitFrontmatter } from "./frontmatter.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
const bash = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";
if (process.platform === "win32") env.PATH = `C:\\Program Files\\Git\\usr\\bin;${env.PATH}`;
function fixture(t) {
  const path = mkdtempSync(join(tmpdir(), "sdlc-kit test "));
  t.after(() => {
    assert.equal(dirname(resolve(path)), resolve(tmpdir()));
    assert.ok(path.includes("sdlc-kit test "));
    rmSync(path, { recursive: true, force: true });
  });
  return path;
}
function run(args, cwd = root, input) {
  const [command, ...rest] = args;
  const result = spawnSync(command, rest, { cwd, env, input, encoding: "utf8", timeout: 30000 });
  if (result.error) throw result.error;
  return result;
}
function ok(args, cwd, input) {
  const result = run(args, cwd, input);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}
const node = (script, ...args) => [process.execPath, join(root, script), ...args];
const fakeToken = "ghp_" + "A".repeat(36);

test("frontmatter rejects ambiguous YAML and preserves colon/quote content", () => {
  assert.throws(() => splitFrontmatter('---\nname: "reviewer"\ndescription: bad: value\n---\n'));
  assert.throws(() => splitFrontmatter('---\nname: "one"\nname: "two"\n---\n'));
  const description = 'Review: the "quoted" example';
  assert.equal(splitFrontmatter(`---\nname: "reviewer"\ndescription: ${JSON.stringify(description)}\n---\n`).meta.description, description);
});

test("build and validation work in a path containing spaces and preserve unrelated agent config", t => {
  const target = fixture(t);
  for (const part of ["scripts", "src", "LICENSE"]) cpSync(join(root, part), join(target, part), { recursive: true });
  mkdirSync(join(target, ".agents/skills/personal"), { recursive: true });
  writeFileSync(join(target, ".agents/skills/personal/keep.txt"), "keep");
  ok([process.execPath, "scripts/build.mjs"], target);
  ok([process.execPath, "scripts/validate-kit.mjs"], target);
  assert.equal(readFileSync(join(target, ".agents/skills/personal/keep.txt"), "utf8"), "keep");
  const agent = join(target, "src/agents/test-author.md");
  writeFileSync(agent, readFileSync(agent, "utf8").replace(/^description:.*$/m, "description: broken: YAML"));
  assert.notEqual(run([process.execPath, "scripts/validate-kit.mjs"], target).status, 0);
});

for (const tool of ["claude", "codex"]) {
  for (const wrapper of ["node", "bash", "powershell"]) {
    test(`${wrapper} installer: ${tool} dry-run, install, preserve files, explicit overwrite`, t => {
      if (wrapper === "powershell" && process.platform !== "win32") return t.skip("PowerShell is exercised on Windows CI");
      const target = fixture(t);
      const entry = wrapper === "node" ? node("scripts/install.mjs") : wrapper === "bash" ? [bash, join(root, "scripts/install.sh")] : ["pwsh", "-NoProfile", "-File", join(root, "scripts/install.ps1")];
      const flags = wrapper === "powershell" ? ["-Target", target, "-Tool", tool, "-Templates"] : [target, "--tool", tool, "--templates"];
      ok([...entry, ...flags, wrapper === "powershell" ? "-DryRun" : "--dry-run"]);
      assert.equal(readdirSync(target).length, 0);
      ok([...entry, ...flags]);
      const skills = join(target, tool === "codex" ? ".agents/skills" : ".claude/skills");
      assert.ok(existsSync(join(skills, "tracker-workflow/SKILL.md")));
      assert.ok(existsSync(join(target, ".sdlc/LICENSE")));
      assert.ok(existsSync(join(target, ".githooks/pre-commit.mjs")));
      const memory = join(target, "AGENTS.md");
      writeFileSync(memory, "existing project memory");
      ok([...entry, ...flags]);
      assert.equal(readFileSync(memory, "utf8"), "existing project memory");
      ok([...entry, ...flags, wrapper === "powershell" ? "-Upgrade" : "--upgrade", wrapper === "powershell" ? "-DryRun" : "--dry-run"]);
      assert.equal(readFileSync(memory, "utf8"), "existing project memory");
      ok([...entry, ...flags, wrapper === "powershell" ? "-Force" : "--force"]);
      assert.notEqual(readFileSync(memory, "utf8"), "existing project memory");
      if (tool === "claude") {
        const command = readFileSync(join(target, ".claude/commands/tracker/setup.md"), "utf8");
        assert.ok(!command.includes("${CLAUDE_PLUGIN_ROOT}"));
        const helper = command.match(/node "([^"]+\/tracker\.mjs)"/)[1];
        ok([process.execPath, resolve(target, helper), "new", "Installed tracker"], target);
      } else {
        const skill = join(skills, "tracker-setup/SKILL.md");
        const helper = readFileSync(skill, "utf8").match(/\[the tracker CLI\]\(([^)]+)\)/)[1];
        ok([process.execPath, resolve(dirname(skill), helper), "new", "Installed tracker"], target);
      }
      assert.ok(readdirSync(join(target, "docs/tracker")).some(file => file.startsWith("TASK-1-")));
    });
  }
}

test("tracker keeps explicit project config and data outside plugin resources", t => {
  const target = fixture(t), project = join(target, "project"), plugin = join(target, "plugin");
  cpSync(join(root, "adapters/codex/tracker"), plugin, { recursive: true });
  mkdirSync(join(project, ".sdlc"), { recursive: true });
  writeFileSync(join(project, ".sdlc/tracker.json"), JSON.stringify({ prefix: "PROJECT", dir: "docs/tracker" }));
  const cli = [process.execPath, join(plugin, "scripts/tracker.mjs")];
  assert.notEqual(run([...cli, "new", "Wrong cwd"], plugin).status, 0);
  const result = ok([...cli, "--root", project, "new", "Correct project"], plugin);
  assert.match(result, /^PROJECT-1/m);
  assert.ok(!existsSync(join(plugin, "docs/tracker")));
  for (const args of [["move", "PROJECT-1", "ready"], ["next"], ["set", "PROJECT-1", "branch=feat/PROJECT-1"], ["comment", "PROJECT-1", "Verified"], ["move", "PROJECT-1", "done"], ["report"], ["list", "--json"], ["--help"], ["-h"]]) ok([...cli, ...args], project);
  for (const args of [["--root"], ["unknown"], ["toString"], ["move", "PROJECT-1", "invalid"]]) assert.notEqual(run([...cli, ...args], project).status, 0);
});

test("tracker validates priority, report window and immutable metadata without changing items", t => {
  const target = fixture(t);
  const cli = node("src/scripts/tracker.mjs", "--root", target);
  assert.notEqual(run([...cli, "new", "Invalid", "--priority", "banana"]).status, 0);
  assert.ok(!existsSync(join(target, "docs/tracker")));
  ok([...cli, "new", "Valid"]);
  const path = join(target, "docs/tracker", readdirSync(join(target, "docs/tracker"))[0]);
  const before = readFileSync(path, "utf8");
  for (const pair of ["id=", "id=TASK-2", "created=yesterday", "updated=tomorrow", "priority=banana", "type=unknown", "bad key=value", "__proto__=value"]) {
    assert.notEqual(run([...cli, "set", "TASK-1", pair]).status, 0, pair);
    assert.equal(readFileSync(path, "utf8"), before);
  }
  for (const value of ["banana", "-1", "1.5", "Infinity", "999999999999999"]) {
    const result = run([...cli, "report", "--days", value]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /tracker:.*days/);
    assert.doesNotMatch(result.stderr, /RangeError|at cmdReport/);
  }
  ok([...cli, "report", "--days", "0"]);
});

for (const tool of ["claude", "codex"]) {
  test(`${tool} upgrade updates untouched files and preserves conflicts with their original baseline`, t => {
    const kit = fixture(t), target = fixture(t);
    for (const part of ["scripts", "src", "templates", "LICENSE"]) cpSync(join(root, part), join(kit, part), { recursive: true });
    ok([process.execPath, "scripts/build.mjs"], kit);
    const cli = [process.execPath, join(kit, "scripts/install.mjs"), target, "--tool", tool];
    ok(cli);
    const base = tool === "claude" ? ".claude" : ".agents";
    const helper = `${base}/${tool === "claude" ? "plugins/tracker/" : ""}scripts/tracker.mjs`;
    const skill = `${base}/skills/tracker-workflow/SKILL.md`;
    const originalSkill = readFileSync(join(target, skill), "utf8");
    const originalHelper = readFileSync(join(target, helper), "utf8").replace(/\r?\n/g, "\r\n");
    writeFileSync(join(target, helper), originalHelper);
    writeFileSync(join(target, skill), originalSkill + "\nLocal instructions\n");
    const receiptPath = join(target, `.sdlc/install-${tool}.json`);
    const receiptBefore = readFileSync(receiptPath, "utf8");
    const manifest = JSON.parse(readFileSync(join(kit, "src/manifest.json"), "utf8"));
    manifest.version = "9.0.0";
    writeFileSync(join(kit, "src/manifest.json"), JSON.stringify(manifest));
    for (const file of ["src/scripts/tracker.mjs", "src/skills/tracker-workflow/SKILL.md"]) {
      writeFileSync(join(kit, file), readFileSync(join(kit, file), "utf8") + "\n// Upstream revision\n");
    }
    ok([process.execPath, "scripts/build.mjs"], kit);
    const dry = run([...cli, "--upgrade", "--dry-run"]);
    assert.equal(dry.status, 2, dry.stdout + dry.stderr);
    assert.match(dry.stdout, /conflict/);
    assert.equal(readFileSync(receiptPath, "utf8"), receiptBefore);
    assert.equal(readFileSync(join(target, helper), "utf8"), originalHelper);
    const upgraded = run([...cli, "--upgrade"]);
    assert.equal(upgraded.status, 2, upgraded.stdout + upgraded.stderr);
    assert.match(readFileSync(join(target, helper), "utf8"), /Upstream revision/);
    assert.equal(readFileSync(join(target, skill), "utf8"), originalSkill + "\nLocal instructions\n");
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
    assert.equal(receipt.files[helper].version, "9.0.0");
    assert.equal(receipt.files[skill].version, JSON.parse(receiptBefore).files[skill].version);
    unlinkSync(join(target, skill));
    const deletedConflict = run([...cli, "--upgrade"]);
    assert.equal(deletedConflict.status, 2);
    assert.match(deletedConflict.stdout, /conflict deleted/);
    assert.ok(!existsSync(join(target, skill)));
    // Restoring the original file makes it safe to upgrade on the next attempt.
    writeFileSync(join(target, skill), originalSkill);
    ok([...cli, "--upgrade"]);
    assert.match(readFileSync(join(target, skill), "utf8"), /Upstream revision/);
    assert.equal(JSON.parse(readFileSync(receiptPath, "utf8")).files[skill].version, "9.0.0");
  });
}

test("upgrade preserves files without a recorded baseline and rejects damaged receipts before writing", t => {
  const target = fixture(t);
  mkdirSync(join(target, ".agents/skills/tracker-workflow"), { recursive: true });
  const path = join(target, ".agents/skills/tracker-workflow/SKILL.md");
  writeFileSync(path, "Existing custom instructions");
  const cli = node("scripts/install.mjs", target, "--tool", "codex", "--upgrade");
  assert.equal(run(cli).status, 2);
  assert.equal(readFileSync(path, "utf8"), "Existing custom instructions");
  const receipt = join(target, ".sdlc/install-codex.json");
  assert.ok(!Object.hasOwn(JSON.parse(readFileSync(receipt, "utf8")).files, ".agents/skills/tracker-workflow/SKILL.md"));
  writeFileSync(receipt, "not JSON");
  const result = run(cli);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /receipt/);
  assert.equal(readFileSync(path, "utf8"), "Existing custom instructions");
});

test("tracker round-trips multiline and quoted metadata and reads legacy items", t => {
  const target = fixture(t), cli = node("src/scripts/tracker.mjs", "--root", target);
  const title = 'Search: "saved"\nstatus: done\n---\nmore';
  ok([...cli, "new", title]);
  let item = JSON.parse(ok([...cli, "list", "--json"]))[0];
  assert.equal(item.title, title);
  assert.equal(item.status, "backlog");
  const note = 'line one\nstatus: done\n"quoted"';
  ok([...cli, "set", "TASK-1", `context=${note}`, "priority=P1"]);
  item = JSON.parse(ok([...cli, "list", "--json"]))[0];
  assert.equal(item.context, note);
  assert.equal(item.status, "backlog");
  writeFileSync(join(target, "docs/tracker/TASK-2-legacy.md"), "---\nid: TASK-2\ntitle: Legacy: title\nstatus: ready\npriority: P2\n---\n\n## Notes\nKeep this body.\n");
  ok([...cli, "move", "TASK-2", "done"]);
  assert.match(ok([...cli, "show", "TASK-2"]), /Keep this body/);
  assert.equal(JSON.parse(ok([...cli, "list", "--json"]))[1].title, "Legacy: title");
  writeFileSync(join(target, "docs/tracker/TASK-3-quoted.md"), '---\nid: TASK-3\ntitle: "quoted": legacy title\nstatus: ready\n---\nBody\n');
  ok([...cli, "move", "TASK-3", "done"]);
  assert.equal(JSON.parse(ok([...cli, "list", "--json"]))[2].title, '"quoted": legacy title');
});

for (const [name, content, removed, expected] of [
  ["normal.txt", "ordinary content", false, 0],
  ["token.txt", fakeToken, false, 1],
  ["file with spaces.txt", fakeToken, false, 1],
  ["deleted-after-stage.txt", fakeToken, true, 1],
  ["modern-openai.txt", "sk-proj-" + "A".repeat(60), false, 1],
  [".env.production.local", "PASSWORD=fixture", false, 1],
  [".env.example", "PASSWORD=placeholder", false, 0],
  [".env.example.private", "PASSWORD=fixture", false, 1],
  ["conflict with spaces.txt", "<<<<<<< HEAD\nleft\n=======\nright\n>>>>>>> branch", false, 1],
  ["key.txt", "-----BEGIN " + "PRIVATE KEY-----", false, 1],
  ["é quoted ' file.txt", fakeToken, false, 1],
]) {
  test(`pre-commit inspects index: ${name}`, t => {
    const target = fixture(t);
    ok(["git", "init", "-q"], target);
    const file = join(target, name);
    writeFileSync(file, content);
    ok(["git", "add", "--", name], target);
    if (removed) unlinkSync(file);
    const result = run([bash, join(root, "templates/git-hooks/pre-commit")], target);
    assert.equal(result.status, expected, result.stderr);
    assert.ok(!result.stderr.includes(fakeToken));
  });
}

test("installed git hook actually rejects a commit", t => {
  const target = fixture(t);
  ok(["git", "init", "-q"], target);
  ok(node("scripts/install.mjs", target, "--templates"));
  ok(["git", "config", "core.hooksPath", ".githooks"], target);
  writeFileSync(join(target, "with spaces.txt"), fakeToken);
  ok(["git", "add", "--", "with spaces.txt"], target);
  const result = run(["git", "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture"], target);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /credential/);
});

for (const [command, deny] of [
  ["git status", false], ["git push --force-with-lease", false], ["git stash list", false],
  ["git push --force", true], ["git push -f", true], ["git -C \"project path\" push -f", true],
  ["git reset --hard", true], ["git -C project reset --hard", true],
  ["rm -rf example", true], ["rm -r -f example", true], ["rm --recursive --force example", true],
]) {
  test(`command guard payload (never executed): ${command}`, () => {
    const output = ok(node("src/hooks/guard-dangerous-bash.mjs"), root, JSON.stringify({ tool_name: "Bash", tool_input: { command } }));
    assert.equal(output ? JSON.parse(output).hookSpecificOutput.permissionDecision === "deny" : false, deny);
  });
}

for (const [path, deny] of [[".env", true], [".env.production.local", true], [".env.example", false], [".env.example.private", true], ["src/app.mjs", false]]) {
  test(`sensitive-file hook: ${path}`, () => {
    const output = ok(node("src/hooks/protect-sensitive-files.mjs"), root, JSON.stringify({ tool_name: "Write", tool_input: { file_path: path } }));
    assert.equal(output ? JSON.parse(output).hookSpecificOutput.permissionDecision === "deny" : false, deny);
  });
}

for (const tool of ["claude", "codex"]) {
  test(`recorded workflow replays through installed ${tool} adapter`, () => {
    assert.match(ok(node("scripts/demo-workflow.mjs", "--tool", tool)), /Tracker lifecycle PASS/);
  });
}

test("installer rejects a receipt junction before writing into either project", t => {
  const target = fixture(t), elsewhere = fixture(t);
  symlinkSync(elsewhere, join(target, ".sdlc"), process.platform === "win32" ? "junction" : "dir");
  const result = run(node("scripts/install.mjs", target, "--tool", "codex", "--upgrade"));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /symlink|junction/);
  assert.ok(!existsSync(join(target, ".agents")));
  assert.deepEqual(readdirSync(elsewhere), []);
});

test("installer rejects conflicting flags and receipt directories before writing files", t => {
  const target = fixture(t), cli = node("scripts/install.mjs", target, "--tool", "codex");
  assert.equal(run([...cli, "--force", "--upgrade"]).status, 1);
  assert.deepEqual(readdirSync(target), []);
  mkdirSync(join(target, ".sdlc/install-codex.json"), { recursive: true });
  assert.equal(run([...cli, "--upgrade"]).status, 1);
  assert.ok(!existsSync(join(target, ".agents")));
});

test("upgrade preserves intentional deletions until explicitly forced", t => {
  const target = fixture(t), cli = node("scripts/install.mjs", target, "--tool", "codex");
  ok(cli);
  const file = join(target, ".agents/skills/tracker-workflow/SKILL.md");
  unlinkSync(file);
  const result = run([...cli, "--upgrade"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /preserve deleted/);
  assert.ok(!existsSync(file));
  ok([...cli, "--force"]);
  assert.ok(existsSync(file));
});
