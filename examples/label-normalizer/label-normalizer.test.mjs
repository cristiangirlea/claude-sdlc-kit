import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLabels } from "./label-normalizer.mjs";

test("AC1 trims, lowercases and deduplicates labels in first-occurrence order", () => {
  assert.deepEqual(normalizeLabels([" Bug ", "bug", "URGENT", "docs"]), ["bug", "urgent", "docs"]);
});

test("AC2 drops blank labels and accepts an empty list", () => {
  assert.deepEqual(normalizeLabels(["", " \t", " docs ", "\n"]), ["docs"]);
  assert.deepEqual(normalizeLabels([]), []);
});

test("AC3 preserves the input array", () => {
  const input = Object.freeze([" Z ", "a", "Z"]);
  normalizeLabels(input);
  assert.deepEqual(input, [" Z ", "a", "Z"]);
});

test("AC4 rejects non-array inputs and non-string elements", () => {
  for (const input of [undefined, null, "bug", 42, {}, ["bug", null], [1], new Array(1)]) {
    assert.throws(() => normalizeLabels(input), TypeError);
  }
});
