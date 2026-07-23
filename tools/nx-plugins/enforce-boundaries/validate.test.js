"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  findViolations,
  findSourceImportViolations,
  collectLegacyPackageNames,
} = require("./validate");

/**
 * @param {Array<{name: string, tags: string[]}>} projects
 * @param {Array<{source: string, target: string}>} edges
 */
function buildGraph(projects, edges) {
  const nodes = Object.fromEntries(projects.map(p => [p.name, { data: { tags: p.tags } }]));
  const dependencies = Object.fromEntries(
    projects.map(p => [
      p.name,
      edges.filter(e => e.source === p.name).map(e => ({ target: e.target })),
    ]),
  );
  return { nodes, dependencies };
}

test("shared -> shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:shared"] },
      { name: "b", tags: ["scope:shared"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("shared -> domain is forbidden (leaf-layer rule)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:shared"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.equal(v[0].sourceName, "a");
  assert.deepEqual(v[0].sourceTags, ["scope:shared"]);
  assert.equal(v[0].target, "b");
});

test("domain -> shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-api"] },
      { name: "b", tags: ["scope:shared"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("domain-entity -> domain-api is forbidden (intra-domain rule)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-entity"] },
      { name: "b", tags: ["scope:domain", "type:domain-api"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].sourceTags, ["type:domain-entity"]);
  assert.equal(v[0].target, "b");
});

test("domain-api -> domain-entity is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-api"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("domain-entity -> domain-entity is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-entity"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("features -> domain is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features"] },
      { name: "b", tags: ["scope:domain", "type:domain-api"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("features -> shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features"] },
      { name: "b", tags: ["scope:shared"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("features -> legacy libs is forbidden (features must stay in new arch)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features"] },
      { name: "b", tags: ["scope:libs", "scope:libs-non-ui"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].sourceTags, ["scope:features"]);
});

test("legacy source (no new-arch tags) is unconstrained", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:libs", "scope:libs-non-ui"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("app source is unconstrained (apps can import anything during migration)", () => {
  const graph = buildGraph(
    [
      { name: "app", tags: ["scope:apps", "type:app-desktop"] },
      { name: "b", tags: ["scope:domain", "type:domain-entity"] },
      { name: "c", tags: ["scope:features"] },
    ],
    [
      { source: "app", target: "b" },
      { source: "app", target: "c" },
    ],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("external deps (target absent from graph.nodes) are skipped", () => {
  const graph = {
    nodes: { a: { data: { tags: ["scope:shared"] } } },
    dependencies: { a: [{ target: "npm:some-package" }, { target: "npm:another" }] },
  };
  assert.deepEqual(findViolations(graph), []);
});

test("multiple violations are all reported", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:shared"] },
      { name: "b", tags: ["scope:domain"] },
      { name: "c", tags: ["scope:features"] },
    ],
    [
      { source: "a", target: "b" },
      { source: "a", target: "c" },
    ],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 2);
  assert.ok(v.every(x => x.sourceName === "a" && x.sourceTags.includes("scope:shared")));
});

test("multi-tag source emits one deduped violation per edge", () => {
  // type:domain-api source also carries scope:domain — both rules match,
  // both forbid scope:features targets. Should produce ONE violation
  // listing both source tags.
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-api"] },
      { name: "b", tags: ["scope:features"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.equal(v[0].sourceName, "a");
  assert.equal(v[0].target, "b");
  assert.ok(v[0].sourceTags.includes("scope:domain"));
  assert.ok(v[0].sourceTags.includes("type:domain-api"));
});

test("feature-platform -> feature-platform is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:features", "type:feature-platform"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-platform -> feature-flow is forbidden (platform sits below flow)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:features", "type:feature-flow"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.equal(v[0].sourceName, "a");
  // scope:features rule is satisfied (target carries scope:features) — only
  // type:feature-platform fails, so just that tag accrues to the violation.
  assert.deepEqual(v[0].sourceTags, ["type:feature-platform"]);
});

test("feature-flow -> feature-platform is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-flow"] },
      { name: "b", tags: ["scope:features", "type:feature-platform"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-flow -> feature-flow is allowed (sibling flows can compose)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-flow"] },
      { name: "b", tags: ["scope:features", "type:feature-flow"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-platform -> domain / shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:domain", "type:domain-api"] },
      { name: "c", tags: ["scope:shared"] },
    ],
    [
      { source: "a", target: "b" },
      { source: "a", target: "c" },
    ],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("feature-platform -> legacy libs is forbidden", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ["scope:libs", "scope:libs-non-ui"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  // Both scope:features and type:feature-platform rules fire and both fail —
  // findViolations dedupes per edge and accumulates both source tags.
  assert.ok(v[0].sourceTags.includes("scope:features"));
  assert.ok(v[0].sourceTags.includes("type:feature-platform"));
});

test("missing tags default to empty array (no crash)", () => {
  const graph = {
    nodes: {
      a: { data: {} },
      b: {},
    },
    dependencies: { a: [{ target: "b" }] },
  };
  // neither node carries tags; no rule fires
  assert.deepEqual(findViolations(graph), []);
});

// --- findSourceImportViolations / collectLegacyPackageNames ---

/**
 * Create a minimal workspace tree in a temp dir and return the root path.
 * @param {{ [relPath: string]: string }} files  path → content
 */
function makeTmpWorkspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "enforce-boundaries-test-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
  }
  return root;
}

test("collectLegacyPackageNames returns @ledgerhq/* names for scope:libs nodes", t => {
  const root = makeTmpWorkspace({
    "libs/foo/package.json": JSON.stringify({ name: "@ledgerhq/foo" }),
    "libs/bar/package.json": JSON.stringify({ name: "@ledgerhq/bar" }),
    "libs/external-only/package.json": JSON.stringify({ name: "some-non-ledger-pkg" }),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = {
    nodes: {
      foo: { data: { root: "libs/foo", tags: ["scope:libs", "scope:libs-non-ui"] } },
      bar: { data: { root: "libs/bar", tags: ["scope:libs", "scope:libs-non-ui"] } },
      ext: { data: { root: "libs/external-only", tags: ["scope:libs"] } },
    },
    dependencies: {},
  };
  const names = collectLegacyPackageNames(graph, root);
  assert.ok(names.has("@ledgerhq/foo"));
  assert.ok(names.has("@ledgerhq/bar"));
  assert.ok(!names.has("some-non-ledger-pkg"));
});

test("collectLegacyPackageNames skips nodes without scope:libs tag", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/package.json": JSON.stringify({ name: "@domain/foo" }),
    "libs/pkg/package.json": JSON.stringify({ name: "@ledgerhq/pkg" }),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = {
    nodes: {
      domainFoo: {
        data: { root: "domain/entity/foo", tags: ["scope:domain", "type:domain-entity"] },
      },
      libsPkg: { data: { root: "libs/pkg", tags: ["scope:libs"] } },
    },
    dependencies: {},
  };
  const names = collectLegacyPackageNames(graph, root);
  assert.ok(!names.has("@domain/foo"));
  assert.ok(names.has("@ledgerhq/pkg"));
});

test("import from legacy in-repo package is flagged", t => {
  const root = makeTmpWorkspace({
    "shared/utils/src/index.ts": 'import { something } from "@ledgerhq/errors";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/errors"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 1);
  assert.ok(violations[0].file.includes("index.ts"));
  assert.equal(violations[0].specifier, "@ledgerhq/errors");
});

test("import from external @ledgerhq/* (not in legacy set) is not flagged", t => {
  const root = makeTmpWorkspace({
    "features/ui/src/Banner.tsx": 'import { Box } from "@ledgerhq/lumen-ui-rnative";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/errors"]); // lumen not in the set
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 0);
});

test("require() of legacy package is flagged", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/src/index.js": 'const x = require("@ledgerhq/live-common");',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/live-common"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].specifier, "@ledgerhq/live-common");
});

test("dynamic import() of legacy package is flagged", t => {
  const root = makeTmpWorkspace({
    "features/flow/foo/src/index.ts": 'const m = await import("@ledgerhq/live-common");',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/live-common"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].specifier, "@ledgerhq/live-common");
});

test("sub-path import is matched by package name", t => {
  const root = makeTmpWorkspace({
    "shared/utils/src/index.ts": 'import type { Foo } from "@ledgerhq/errors/types";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/errors"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].specifier, "@ledgerhq/errors/types");
});

test("relative import resolving into libs/ is flagged", t => {
  const root = makeTmpWorkspace({
    "shared/utils/src/index.ts": 'import something from "../../../libs/errors/src/index";',
    "libs/errors/src/index.ts": "export const err = 1;",
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const violations = findSourceImportViolations(root, new Set());
  assert.equal(violations.length, 1);
  assert.ok(violations[0].specifier.includes("libs/errors"));
});

test("relative import NOT resolving into libs/ is not flagged", t => {
  const root = makeTmpWorkspace({
    "shared/utils/src/index.ts": 'import something from "./helper";',
    "shared/utils/src/helper.ts": "export const x = 1;",
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const violations = findSourceImportViolations(root, new Set());
  assert.equal(violations.length, 0);
});

test("files in node_modules/ under new-arch roots are skipped", t => {
  const root = makeTmpWorkspace({
    "shared/utils/node_modules/@ledgerhq/errors/index.ts":
      'import something from "@ledgerhq/live-common";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/live-common"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 0);
});

test("files in dist/ under new-arch roots are skipped", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/dist/index.js": 'const x = require("@ledgerhq/errors");',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/errors"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 0);
});

test("multiple violations across different layers are all reported", t => {
  const root = makeTmpWorkspace({
    "shared/a/src/index.ts": 'import { x } from "@ledgerhq/errors";',
    "domain/entity/b/src/index.ts": 'import { y } from "@ledgerhq/live-common";',
    "features/flow/c/src/index.ts": 'import { z } from "@ledgerhq/errors";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/errors", "@ledgerhq/live-common"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 3);
});

test("no violations in a clean workspace", t => {
  const root = makeTmpWorkspace({
    "shared/a/src/index.ts": "export const x = 1;",
    "domain/entity/b/src/index.ts": 'import { x } from "@domain/entity-a";',
    "features/flow/c/src/index.ts": 'import { Box } from "@ledgerhq/lumen-ui-rnative";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/errors"]); // lumen not in set
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 0);
});
