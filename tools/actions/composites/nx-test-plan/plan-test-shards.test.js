"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { buildPlan, planShards, countTestFiles } = require("./plan-test-shards");

const node = (name, root, tags, targets = []) => ({
  name,
  data: { root, tags, targets: Object.fromEntries(targets.map(t => [t, {}])) },
});

const graphOf = (...nodes) => ({
  graph: { nodes: Object.fromEntries(nodes.map(n => [n.name, n])) },
});

test("nested package test files belong to the deepest root", () => {
  const counts = countTestFiles(
    [
      "libs/ledgerjs/a.test.ts",
      "libs/ledgerjs/packages/x/b.test.ts",
      "libs/ledgerjs/packages/x/c.ts",
    ],
    ["libs/ledgerjs", "libs/ledgerjs/packages/x"],
  );
  assert.strictEqual(counts.get("libs/ledgerjs"), 1);
  assert.strictEqual(counts.get("libs/ledgerjs/packages/x"), 1);
});

test("affected projects outside the package scopes are not planned", () => {
  const graph = graphOf(
    node("desktop", "apps/ledger-live-desktop", ["scope:apps"], ["coverage"]),
    node("shared-a", "shared/a", ["scope:shared"], ["coverage"]),
  );
  const shards = buildPlan({ graph, affected: ["desktop", "shared-a"], files: [] });
  assert.strictEqual(shards.length, 1);
  assert.strictEqual(shards[0].projects, "shared-a");
});

test("UI libs are codechecked but not tested, and libs without coverage run test", () => {
  const graph = graphOf(
    node("ui", "libs/ui/react", ["scope:libs", "scope:libs-ui"], ["coverage", "lint"]),
    node("lib-cov", "libs/a", ["scope:libs", "scope:libs-non-ui"], ["coverage", "test"]),
    node("lib-test", "libs/b", ["scope:libs", "scope:libs-non-ui"], ["test"]),
    node("feat-test", "features/c", ["scope:features"], ["test"]),
  );
  const [shard] = buildPlan({
    graph,
    affected: ["ui", "lib-cov", "lib-test", "feat-test"],
    files: [],
  });
  assert.strictEqual(shard.projects, "feat-test,lib-cov,lib-test,ui");
  assert.strictEqual(shard.coverage, "lib-cov");
  assert.strictEqual(shard.test, "lib-test");
});

test("domain projects with check-export-rules are listed for it", () => {
  const graph = graphOf(
    node("d1", "domain/entity/x", ["scope:domain"], ["coverage", "check-export-rules"]),
    node("d2", "domain/entity/y", ["scope:domain"], ["coverage"]),
  );
  const [shard] = buildPlan({ graph, affected: ["d1", "d2"], files: [] });
  assert.strictEqual(shard.export_rules, "d1");
});

test("a typical PR consolidates into one shard", () => {
  const projects = Array.from({ length: 30 }, (_, i) => ({
    name: `p${i}`,
    root: `r${i}`,
    weight: 40,
  }));
  assert.strictEqual(planShards(projects).length, 1);
});

test("a large change splits into balanced shards, capped", () => {
  const projects = [
    { name: "big", root: "libs/big", weight: 1500 },
    ...Array.from({ length: 100 }, (_, i) => ({ name: `p${i}`, root: `r${i}`, weight: 30 })),
  ];
  const shards = planShards(projects, { maxWeightPerShard: 1500, maxShards: 4 });
  assert.strictEqual(shards.length, 3);
  const weights = shards.map(s => s.weight);
  assert.ok(Math.max(...weights) - Math.min(...weights) <= 30, `unbalanced: ${weights}`);

  const capped = planShards(projects, { maxWeightPerShard: 100, maxShards: 4 });
  assert.strictEqual(capped.length, 4);
});

test("no affected projects gives no shards", () => {
  assert.deepStrictEqual(planShards([]), []);
});
