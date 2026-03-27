// Run with: node scripts/shard-tests.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { distributeFilesRoundRobinNoTiming } from "./shard-utils.mjs";

const SCRIPT = new URL("./shard-tests.mjs", import.meta.url).pathname;

function createTempSpecDir(specNames) {
  const root = mkdtempSync(join(process.env.TMPDIR ?? "/tmp", "shard-test-"));
  const specsDir = join(root, "specs");
  mkdirSync(specsDir);
  for (const name of specNames) {
    writeFileSync(join(specsDir, name), `describe("${name}", () => {})`);
  }
  return root;
}

function run(...args) {
  const out = execFileSync("node", [SCRIPT, ...args], { encoding: "utf8" }).trim();
  return out ? out.split(" ") : [];
}

function shardAll(files, shardTotal) {
  return Array.from({ length: shardTotal }, (_, i) =>
    distributeFilesRoundRobinNoTiming(files, i + 1, shardTotal),
  );
}

test("no empty shard when files >= shardTotal (33 files / 12 shards)", () => {
  const files = Array.from({ length: 33 }, (_, i) => `t${i}`);
  const shards = shardAll(files, 12);
  assert.ok(
    shards.every(s => s.length > 0),
    "every shard must have at least one file",
  );
  assert.deepEqual(shards.flat().sort(), files.sort());
});

test("no empty shard when files === shardTotal (12 files / 12 shards)", () => {
  const files = Array.from({ length: 12 }, (_, i) => `t${i}`);
  const shards = shardAll(files, 12);
  assert.ok(shards.every(s => s.length === 1));
  assert.deepEqual(shards.flat().sort(), files.sort());
});

test("files divisible by shards with no remainder (24 files / 12 shards)", () => {
  const files = Array.from({ length: 24 }, (_, i) => `t${i}`);
  const shards = shardAll(files, 12);
  assert.ok(shards.every(s => s.length === 2));
  assert.deepEqual(shards.flat().sort(), files.sort());
});

test("when files < shardTotal, trailing shards are empty and all files are assigned", () => {
  const files = ["a", "b", "c"];
  const shards = shardAll(files, 5);
  assert.deepEqual(
    shards.map(s => s.length),
    [1, 1, 1, 0, 0],
  );
  assert.deepEqual(shards.flat().sort(), files.sort());
});

// --- main() integration tests (spawns shard-tests.mjs as a subprocess) ---

test("main: no filter returns all spec files", () => {
  const dir = createTempSpecDir(["a.spec.ts", "b.spec.ts", "c.spec.ts"]);
  const files = run("", dir);
  assert.equal(files.length, 3);
});

test("main: filter by filename returns only matching files", () => {
  const dir = createTempSpecDir(["swap.spec.ts", "accounts.spec.ts", "swapAdvanced.spec.ts"]);
  const files = run("swap", dir);
  assert.ok(files.every(f => f.includes("swap")));
  assert.equal(files.length, 2);
});

test("main: shard mode distributes files with no empty last shard (33 files / 12 shards)", () => {
  const specs = Array.from({ length: 33 }, (_, i) => `test${i}.spec.ts`);
  const dir = createTempSpecDir(specs);
  const allFiles = run("", dir).join(" ");
  const shards = Array.from({ length: 12 }, (_, i) =>
    run(allFiles, "android", dir, String(i + 1), "12"),
  );
  assert.ok(
    shards.every(s => s.length > 0),
    "no shard should be empty",
  );
  assert.equal(shards.flat().length, 33);
  assert.equal(new Set(shards.flat()).size, 33);
});

test("main: shard mode with filter only shards matching files", () => {
  const specs = [
    ...Array.from({ length: 5 }, (_, i) => `swap${i}.spec.ts`),
    ...Array.from({ length: 20 }, (_, i) => `accounts${i}.spec.ts`),
  ];
  const dir = createTempSpecDir(specs);
  const filteredFiles = run("swap", dir).join(" ");
  assert.equal(filteredFiles.split(" ").length, 5);
  const shards = Array.from({ length: 12 }, (_, i) =>
    run(filteredFiles, "android", dir, String(i + 1), "12"),
  );
  const assigned = shards.flat();
  assert.equal(assigned.length, 5);
  assert.ok(assigned.every(f => f.includes("swap")));
});
