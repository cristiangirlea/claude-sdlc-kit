#!/usr/bin/env node
// Replay the recorded feature in a disposable project; never invoke a model.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(root, "examples/label-normalizer");
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 2 && args[0] === "--tool" && ["claude", "codex"].includes(args[1])), "Usage: node scripts/demo-workflow.mjs [--tool claude|codex]");
const tool = args[1] || "codex";
const project = mkdtempSync(join(tmpdir(), "sdlc-workflow-demo-"));
// A replay started by node:test must launch an independent test process.
const childEnv = { ...process.env };
delete childEnv.NODE_TEST_CONTEXT;
function run(args, expected = 0) {
  const result = spawnSync(process.execPath, args, { cwd: project, env: childEnv, encoding: "utf8", timeout: 30000 });
  if (result.error) throw result.error;
  assert.equal(result.status, expected, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

try {
  run([join(root, "scripts/install.mjs"), project, "--tool", tool]);
  const tracker = tool === "codex" ? ".agents/scripts/tracker.mjs" : ".claude/plugins/tracker/scripts/tracker.mjs";
  for (const file of ["SPEC.md", "PLAN.md", "label-normalizer.test.mjs"]) copyFileSync(join(example, file), join(project, file));
  assert.match(run([tracker, "new", "Normalize issue labels"]), /^TASK-1/m);
  run([tracker, "set", "TASK-1", "spec=SPEC.md"]);
  run([tracker, "move", "TASK-1", "ready"]);
  run([tracker, "move", "TASK-1", "in-progress"]);
  console.log(`${tool}: install and tracker intake PASS`);

  copyFileSync(join(example, "starter.mjs"), join(project, "label-normalizer.mjs"));
  const tests = ["--test", "--test-reporter=tap", "label-normalizer.test.mjs"];
  const red = run(tests, 1);
  assert.match(red, /ERR_ASSERTION/);
  assert.match(red, /# fail 3\b/);
  console.log("RED: 3 expected behavioral failures (no import failure)");

  copyFileSync(join(example, "label-normalizer.mjs"), join(project, "label-normalizer.mjs"));
  const green = run(tests);
  assert.match(green, /# pass 4\b/);
  assert.match(green, /# fail 0\b/);
  run(["--check", "label-normalizer.mjs"]);
  assert.equal(readFileSync(join(project, "label-normalizer.test.mjs"), "utf8"), readFileSync(join(example, "label-normalizer.test.mjs"), "utf8"));
  console.log("GREEN: 4 passing tests; syntax PASS; tests unchanged");

  run([tracker, "move", "TASK-1", "in-review"]);
  run([tracker, "comment", "TASK-1", "Deterministic replay verified; original self-review is examples/label-normalizer/REVIEW.md. No model review performed by this replay."]);
  run([tracker, "move", "TASK-1", "done"]);
  const items = JSON.parse(run([tracker, "list", "--json"]));
  assert.equal(items.length, 1);
  assert.equal(items[0].status, "done");
  console.log("Tracker lifecycle PASS; replay complete (no model invoked)");
} finally {
  assert.equal(dirname(resolve(project)), resolve(tmpdir()));
  assert.ok(project.startsWith(join(tmpdir(), "sdlc-workflow-demo-")));
  rmSync(project, { recursive: true, force: true });
}
