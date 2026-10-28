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
  findBannedDependencyViolations,
  findBannedExternalViolations,
  findDevtoolsImportViolations,
} = require("./validate");
const {
  BOUNDARY_EXCEPTIONS,
  LEGACY_PACKAGES,
  BANNED_EXTERNALS_BY_TAG,
  DEVTOOLS_ALLOWED_IMPORTS,
  DEVTOOLS_TYPE_ONLY_IMPORTS,
} = require("./constraints");

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

test("support -> shared is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:support"] },
      { name: "b", tags: ["scope:shared"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("support -> domain is forbidden (tooling carries no domain knowledge)", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:support"] },
      { name: "b", tags: ["scope:domain", "type:domain-api"] },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].sourceTags, ["scope:support"]);
  assert.equal(v[0].target, "b");
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
    "shared/utils/src/index.ts": 'import { something } from "@ledgerhq/logs";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/logs"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 1);
  assert.ok(violations[0].file.includes("index.ts"));
  assert.equal(violations[0].specifier, "@ledgerhq/logs");
});

test("import from external @ledgerhq/* (not in legacy set) is not flagged", t => {
  const root = makeTmpWorkspace({
    "features/ui/src/Banner.tsx": 'import { Box } from "@ledgerhq/lumen-ui-rnative";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/logs"]); // lumen not in the set
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

test("an import after a string reading import or from is flagged, a commented import is not", t => {
  const root = makeTmpWorkspace({
    "shared/utils/src/a.ts":
      'const action = "import";\nimport { a } from "@ledgerhq/logs";\nconst word = "from";\nimport { b } from "@ledgerhq/errors";',
    "shared/utils/src/b.ts":
      '// import "@ledgerhq/logs";\n/* require("@ledgerhq/errors") */\nexport {};',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/logs", "@ledgerhq/errors"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.deepEqual(violations.map(v => `${path.basename(v.file)} ${v.specifier}`).sort(), [
    "a.ts @ledgerhq/errors",
    "a.ts @ledgerhq/logs",
  ]);
});

test("sub-path import is matched by package name", t => {
  const root = makeTmpWorkspace({
    "shared/utils/src/index.ts": 'import type { Foo } from "@ledgerhq/logs/types";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/logs"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].specifier, "@ledgerhq/logs/types");
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
    "shared/utils/node_modules/@ledgerhq/logs/index.ts":
      'import something from "@ledgerhq/live-common";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/live-common"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 0);
});

test("files in dist/ under new-arch roots are skipped", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/dist/index.js": 'const x = require("@ledgerhq/logs");',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/logs"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 0);
});

test("multiple violations across different layers are all reported", t => {
  const root = makeTmpWorkspace({
    "shared/a/src/index.ts": 'import { x } from "@ledgerhq/logs";',
    "domain/entity/b/src/index.ts": 'import { y } from "@ledgerhq/live-common";',
    "features/flow/c/src/index.ts": 'import { z } from "@ledgerhq/logs";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/logs", "@ledgerhq/live-common"]);
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 3);
});

test("findViolations: BOUNDARY_EXCEPTIONS skips an otherwise-forbidden edge", () => {
  const graph = {
    nodes: {
      "shared/live-env": { data: { root: "shared/live-env", tags: ["scope:shared"] } },
      "libs/env": { data: { root: "libs/env", tags: ["scope:libs", "scope:libs-non-ui"] } },
    },
    dependencies: {
      "shared/live-env": [{ target: "libs/env" }],
      "libs/env": [],
    },
  };
  const exceptions = [
    { sourceRoot: "shared/live-env", targetRoot: "libs/env", allowedImport: "@ledgerhq/live-env" },
  ];
  assert.deepEqual(findViolations(graph, exceptions), []);
  // Without the exception it would fire:
  assert.equal(findViolations(graph, []).length, 1);
});

test("findSourceImportViolations: BOUNDARY_EXCEPTIONS suppresses allowed import", t => {
  const root = makeTmpWorkspace({
    "shared/live-env/src/index.ts": 'import { injectDefinitions } from "@ledgerhq/live-env";',
    "shared/other/src/index.ts": 'import { getEnv } from "@ledgerhq/live-env";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/live-env"]);
  const exceptions = [
    { sourceRoot: "shared/live-env", targetRoot: "libs/env", allowedImport: "@ledgerhq/live-env" },
  ];
  const violations = findSourceImportViolations(root, legacy, exceptions);
  // shared/other is NOT excepted — only shared/live-env is
  assert.equal(violations.length, 1);
  assert.ok(violations[0].file.includes("shared/other"));
});

test("no violations in a clean workspace", t => {
  const root = makeTmpWorkspace({
    "shared/a/src/index.ts": "export const x = 1;",
    "domain/entity/b/src/index.ts": 'import { x } from "@domain/entity-a";',
    "features/flow/c/src/index.ts": 'import { Box } from "@ledgerhq/lumen-ui-rnative";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const legacy = new Set(["@ledgerhq/logs"]); // lumen not in set
  const violations = findSourceImportViolations(root, legacy);
  assert.equal(violations.length, 0);
});

const BANNED = [{ name: "@ledgerhq/banned", reason: "frozen" }];

/** @param {Record<string, object>} manifests keyed by project root */
function bannedDepGraph(manifests) {
  return {
    nodes: Object.fromEntries(Object.keys(manifests).map(root => [root, { data: { root } }])),
    dependencies: {},
  };
}

test("findBannedDependencyViolations flags a banned dependency", t => {
  const manifests = {
    "libs/a": { name: "@ledgerhq/a", dependencies: { "@ledgerhq/banned": "workspace:^" } },
  };
  const root = makeTmpWorkspace({
    "libs/a/package.json": JSON.stringify(manifests["libs/a"]),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const violations = findBannedDependencyViolations(bannedDepGraph(manifests), root, BANNED);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].manifest, path.join("libs/a", "package.json"));
  assert.equal(violations[0].dependency, "@ledgerhq/banned");
  assert.equal(violations[0].field, "dependencies");
});

test("findBannedDependencyViolations covers every dependency field", t => {
  const manifests = {
    "libs/a": { name: "@ledgerhq/a", devDependencies: { "@ledgerhq/banned": "workspace:^" } },
    "libs/b": { name: "@ledgerhq/b", peerDependencies: { "@ledgerhq/banned": "^6.0.0" } },
    // optionalDependencies is a real escape hatch: 10 manifests in this repo use it
    "libs/c": { name: "@ledgerhq/c", optionalDependencies: { "@ledgerhq/banned": "workspace:^" } },
  };
  const root = makeTmpWorkspace({
    "libs/a/package.json": JSON.stringify(manifests["libs/a"]),
    "libs/b/package.json": JSON.stringify(manifests["libs/b"]),
    "libs/c/package.json": JSON.stringify(manifests["libs/c"]),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const violations = findBannedDependencyViolations(bannedDepGraph(manifests), root, BANNED);
  assert.equal(violations.length, 3);
  assert.deepEqual(violations.map(v => v.field).sort(), [
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]);
});

test("findBannedDependencyViolations skips the banned package's own manifest", t => {
  const manifests = {
    "libs/banned": { name: "@ledgerhq/banned", dependencies: { "@ledgerhq/banned": "1.0.0" } },
  };
  const root = makeTmpWorkspace({
    "libs/banned/package.json": JSON.stringify(manifests["libs/banned"]),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(findBannedDependencyViolations(bannedDepGraph(manifests), root, BANNED), []);
});

test("findBannedDependencyViolations is a no-op with no banned packages", t => {
  const manifests = {
    "libs/a": { name: "@ledgerhq/a", dependencies: { "@ledgerhq/banned": "workspace:^" } },
  };
  const root = makeTmpWorkspace({
    "libs/a/package.json": JSON.stringify(manifests["libs/a"]),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(findBannedDependencyViolations(bannedDepGraph(manifests), root, []), []);
});

test("findBannedDependencyViolations ignores unrelated dependencies and missing manifests", t => {
  const manifests = {
    "libs/a": { name: "@ledgerhq/a", dependencies: { "@ledgerhq/logs": "workspace:^" } },
    "libs/gone": { name: "@ledgerhq/gone" },
  };
  const root = makeTmpWorkspace({
    "libs/a/package.json": JSON.stringify(manifests["libs/a"]),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(findBannedDependencyViolations(bannedDepGraph(manifests), root, BANNED), []);
});

test("every manifest check fails on a malformed or unreadable manifest", t => {
  const root = makeTmpWorkspace({
    "libs/broken/package.json": '{ "name": "@ledgerhq/broken",',
    // a directory where the manifest should be: present, but not readable as a file
    "libs/unreadable/package.json/.keep": "",
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const tags = ["scope:libs", "type:domain-entity"];
  const checks = [
    graph => collectLegacyPackageNames(graph, root),
    graph => findBannedDependencyViolations(graph, root, BANNED),
    graph =>
      findBannedExternalViolations(graph, root, [{ sourceTag: tags[1], packages: ["react"] }]),
    graph => findDevtoolsImportViolations(graph, root, {}),
  ];
  for (const [projectRoot, error] of [
    ["libs/broken", /libs\/broken\/package\.json/],
    ["libs/unreadable", { code: "EISDIR" }],
  ]) {
    const graph = { nodes: { p: { data: { root: projectRoot, tags } } }, dependencies: {} };
    for (const check of checks) assert.throws(() => check(graph), error);
  }
});

// --- LEGACY_PACKAGES / BANNED_EXTERNALS_BY_TAG (real constraints) ---

test("domain source importing an npm legacy package fails", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/src/index.ts": 'import { getConfig } from "@ledgerhq/live-config";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const violations = findSourceImportViolations(
    root,
    new Set(LEGACY_PACKAGES),
    BOUNDARY_EXCEPTIONS,
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].specifier, "@ledgerhq/live-config");
});

test("shared/env importing @ledgerhq/live-env passes, another shared package fails", t => {
  const root = makeTmpWorkspace({
    "shared/env/src/index.ts": 'import { getEnv } from "@ledgerhq/live-env";',
    "shared/other/src/index.ts": 'import { getEnv } from "@ledgerhq/live-env";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const violations = findSourceImportViolations(
    root,
    new Set(LEGACY_PACKAGES),
    BOUNDARY_EXCEPTIONS,
  );
  assert.equal(violations.length, 1);
  assert.ok(violations[0].file.startsWith(path.join("shared", "other")));
});

/** @param {Record<string, string[]>} tagsByRoot */
function taggedGraph(tagsByRoot) {
  return {
    nodes: Object.fromEntries(
      Object.entries(tagsByRoot).map(([root, tags]) => [root, { data: { root, tags } }]),
    ),
    dependencies: {},
  };
}

test("domain/entity manifest declaring react fails", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/package.json": JSON.stringify({
      name: "@domain/entity-foo",
      peerDependencies: { react: "*" },
      devDependencies: { "react-native": "*" },
    }),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = taggedGraph({ "domain/entity/foo": ["scope:domain", "type:domain-entity"] });
  const violations = findBannedExternalViolations(graph, root, BANNED_EXTERNALS_BY_TAG);
  assert.deepEqual(violations.map(v => `${v.specifier}:${v.field}`).sort(), [
    "react-native:devDependencies",
    "react:peerDependencies",
  ]);
  assert.ok(violations.every(v => v.file === path.join("domain/entity/foo", "package.json")));
});

test("domain/api manifest declaring react passes", t => {
  const root = makeTmpWorkspace({
    "domain/api/foo/package.json": JSON.stringify({
      name: "@domain/api-foo",
      peerDependencies: { react: "*" },
    }),
    "domain/api/foo/src/hooks.ts": 'import { useMemo } from "react";',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = taggedGraph({ "domain/api/foo": ["scope:domain", "type:domain-api"] });
  assert.deepEqual(findBannedExternalViolations(graph, root, BANNED_EXTERNALS_BY_TAG), []);
});

test("domain/entity source importing react or a react sub-path fails, react-dom-like names do not", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/package.json": JSON.stringify({ name: "@domain/entity-foo" }),
    "domain/entity/foo/src/a.ts": 'import { useMemo } from "react";',
    "domain/entity/foo/src/b.tsx": 'import { jsx } from "react/jsx-runtime";',
    "domain/entity/foo/src/c.ts": 'import { View } from "react-native-svg";',
    "domain/entity/foo/src/e.ts": 'import "react-native";',
    "domain/entity/foo/dist/d.js": 'require("react");',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = taggedGraph({ "domain/entity/foo": ["scope:domain", "type:domain-entity"] });
  const violations = findBannedExternalViolations(graph, root, BANNED_EXTERNALS_BY_TAG);
  assert.deepEqual(violations.map(v => v.specifier).sort(), [
    "react",
    "react-native",
    "react/jsx-runtime",
  ]);
  assert.ok(violations.every(v => v.field === undefined));
});

test("domain/entity: react after a string reading import is flagged, a commented react import is not", t => {
  const root = makeTmpWorkspace({
    "domain/entity/foo/package.json": JSON.stringify({ name: "@domain/entity-foo" }),
    "domain/entity/foo/src/a.ts": 'const action = "import";\nimport { useMemo } from "react";',
    "domain/entity/foo/src/b.ts": '// import "react";\nexport {};',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = taggedGraph({ "domain/entity/foo": ["scope:domain", "type:domain-entity"] });
  const violations = findBannedExternalViolations(graph, root, BANNED_EXTERNALS_BY_TAG);
  assert.deepEqual(
    violations.map(v => `${path.basename(v.file)} ${v.specifier}`),
    ["a.ts react"],
  );
});

/**
 * A graph whose node names are project roots, with a manifest written for each.
 *
 * @param {import("node:test").TestContext} t
 * @param {Record<string, object>} manifests keyed by project root
 * @param {Array<[string, string]>} edges [sourceRoot, targetRoot]
 * @param {Record<string, string>} [sources] extra files keyed by workspace-relative path
 */
function manifestWorkspace(t, manifests, edges, sources = {}) {
  const root = makeTmpWorkspace({
    ...Object.fromEntries(
      Object.entries(manifests).map(([r, pkg]) => [`${r}/package.json`, JSON.stringify(pkg)]),
    ),
    ...sources,
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = {
    nodes: Object.fromEntries(Object.keys(manifests).map(r => [r, { data: { root: r } }])),
    dependencies: Object.fromEntries(
      Object.keys(manifests).map(r => [
        r,
        edges.filter(([s]) => s === r).map(([, target]) => ({ target })),
      ]),
    ),
  };
  return { root, graph };
}

/**
 * @param {object} graph
 * @param {string} root
 */
function devtoolsViolations(graph, root) {
  return findDevtoolsImportViolations(
    graph,
    root,
    DEVTOOLS_ALLOWED_IMPORTS,
    DEVTOOLS_TYPE_ONLY_IMPORTS,
  );
}

/**
 * The rules table of the devtools-import-boundary skill, read back into the shape of
 * `DEVTOOLS_ALLOWED_IMPORTS` and `DEVTOOLS_TYPE_ONLY_IMPORTS`.
 */
function skillDevtoolsTables() {
  const skill = fs.readFileSync(
    path.join(__dirname, "../../../.agents/skills/devtools-import-boundary/SKILL.md"),
    "utf8",
  );
  const allowed = {};
  const typeOnly = {};
  for (const [, pkg, cell] of skill.matchAll(/^\| `(@devtools\/[\w-]+)` \| (.+) \|$/gm)) {
    for (const part of cell.split(";").map(p => p.trim())) {
      const table = part.endsWith("through `import type` only") ? typeOnly : allowed;
      table[pkg] = part.startsWith("any `@devtools/<tool>`")
        ? "*"
        : [...part.matchAll(/`(@devtools\/[\w-]+)`/g)].map(m => m[1]);
    }
  }
  return { allowed, typeOnly };
}

test("devtools: the skill's rules table matches constraints.js", () => {
  const { allowed, typeOnly } = skillDevtoolsTables();
  assert.deepEqual(allowed, DEVTOOLS_ALLOWED_IMPORTS);
  assert.deepEqual(typeOnly, DEVTOOLS_TYPE_ONLY_IMPORTS);
});

const DEVTOOLS_MANIFESTS = {
  "devtools/shell": { name: "@devtools/shell", private: true },
  "devtools/registry": { name: "@devtools/registry", private: true },
  "devtools/bindings": { name: "@devtools/bindings", private: true },
  "devtools/relay": { name: "@devtools/relay", private: true },
  "devtools/protocols": { name: "@devtools/protocols", private: true },
  "devtools/env": { name: "@devtools/env", private: true },
  "devtools/feature-flags": { name: "@devtools/feature-flags", private: true },
};

test("devtools: a tool importing @devtools/shell is forbidden", t => {
  const { root, graph } = manifestWorkspace(t, DEVTOOLS_MANIFESTS, [
    ["devtools/env", "devtools/shell"],
  ]);
  assert.deepEqual(devtoolsViolations(graph, root), [
    { source: "@devtools/env", target: "@devtools/shell" },
  ]);
});

test("devtools: a tool importing another tool is forbidden", t => {
  const { root, graph } = manifestWorkspace(t, DEVTOOLS_MANIFESTS, [
    ["devtools/env", "devtools/feature-flags"],
  ]);
  assert.equal(devtoolsViolations(graph, root).length, 1);
});

test("devtools: @devtools/shell importing @devtools/registry is allowed", t => {
  const { root, graph } = manifestWorkspace(t, DEVTOOLS_MANIFESTS, [
    ["devtools/shell", "devtools/registry"],
  ]);
  assert.deepEqual(devtoolsViolations(graph, root), []);
});

test('devtools: "*" lets @devtools/registry import any tool', t => {
  const { root, graph } = manifestWorkspace(t, DEVTOOLS_MANIFESTS, [
    ["devtools/registry", "devtools/env"],
    ["devtools/registry", "devtools/feature-flags"],
  ]);
  assert.deepEqual(devtoolsViolations(graph, root), []);
});

test("devtools: @devtools/shell importing a tool directly is forbidden", t => {
  const { root, graph } = manifestWorkspace(t, DEVTOOLS_MANIFESTS, [
    ["devtools/shell", "devtools/env"],
  ]);
  assert.deepEqual(devtoolsViolations(graph, root), [
    { source: "@devtools/shell", target: "@devtools/env" },
  ]);
});

test("devtools: @devtools/relay importing @devtools/protocols is allowed", t => {
  const { root, graph } = manifestWorkspace(t, DEVTOOLS_MANIFESTS, [
    ["devtools/relay", "devtools/protocols"],
  ]);
  assert.deepEqual(devtoolsViolations(graph, root), []);
});

test("devtools: @devtools/bindings may import a tool's types with import type", t => {
  const { root, graph } = manifestWorkspace(
    t,
    DEVTOOLS_MANIFESTS,
    [["devtools/bindings", "devtools/env"]],
    {
      "devtools/bindings/src/useEnv.ts": [
        'import type { EnvDevToolProps } from "@devtools/env";',
        'export type { EnvVarEntry } from "@devtools/env";',
        'type Loader = typeof import("@devtools/env");',
      ].join("\n"),
    },
  );
  assert.deepEqual(devtoolsViolations(graph, root), []);
});

test("devtools: @devtools/bindings importing a tool's values is forbidden", t => {
  const { root, graph } = manifestWorkspace(
    t,
    DEVTOOLS_MANIFESTS,
    [["devtools/bindings", "devtools/env"]],
    {
      "devtools/bindings/src/types.ts": 'import type { EnvDevToolProps } from "@devtools/env";',
      "devtools/bindings/src/useEnv.ts":
        'import { type EnvVarEntry, EnvDevTool } from "@devtools/env";',
      "devtools/bindings/src/lazy.ts": 'export const load = () => import("@devtools/env");',
    },
  );
  assert.deepEqual(
    devtoolsViolations(graph, root)
      .map(v => v.file)
      .sort(),
    [path.join("devtools/bindings/src/lazy.ts"), path.join("devtools/bindings/src/useEnv.ts")],
  );
});

test("devtools: @devtools/shell importing a tool's types is forbidden", t => {
  const { root, graph } = manifestWorkspace(
    t,
    DEVTOOLS_MANIFESTS,
    [["devtools/shell", "devtools/env"]],
    { "devtools/shell/src/a.ts": 'import type { EnvDevToolProps } from "@devtools/env";' },
  );
  assert.deepEqual(devtoolsViolations(graph, root), [
    { source: "@devtools/shell", target: "@devtools/env" },
  ]);
});

test("devtools: a static and a dynamic edge to the same package report once", t => {
  const { root, graph } = manifestWorkspace(t, DEVTOOLS_MANIFESTS, [
    ["devtools/env", "devtools/shell"],
    ["devtools/env", "devtools/shell"],
  ]);
  assert.equal(devtoolsViolations(graph, root).length, 1);
});

test("devtools: edges to or from packages outside the scope are ignored", t => {
  const { root, graph } = manifestWorkspace(
    t,
    { ...DEVTOOLS_MANIFESTS, "shared/foo": { name: "@shared/foo", private: true } },
    [
      ["devtools/env", "shared/foo"],
      ["shared/foo", "devtools/shell"],
    ],
  );
  assert.deepEqual(devtoolsViolations(graph, root), []);
});
