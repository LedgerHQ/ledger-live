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
  findDevtoolsHostViolations,
  formatDevtoolsImportViolation,
  formatDevtoolsHostViolation,
  sourceFiles,
  DEVTOOLS_ROOT,
} = require("./validate");
const {
  BOUNDARY_EXCEPTIONS,
  LEGACY_SOURCE_ROOTS,
  LEGACY_PACKAGES,
  BANNED_EXTERNALS_BY_TAG,
  BANNED_DEPENDENCIES,
  DEVTOOLS_ALLOWED_IMPORTS,
  DEVTOOLS_TYPE_ONLY_IMPORTS,
  DEVTOOLS_LAZY_IMPORTS,
  DEVTOOLS_HOST_APPS,
} = require("./constraints");
const {
  isLintBoundariesInput,
  assertSourceFilesHashed,
  assertSkipDirsExcluded,
} = require("./test-helpers");

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

const ACCOUNT_DATA_SOURCE_TAGS = [
  "scope:features",
  "type:feature-platform",
  "type:account-data-source",
];

test("feature-flow -> account-data source is forbidden", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-flow"] },
      { name: "b", tags: ACCOUNT_DATA_SOURCE_TAGS },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].sourceTags, ["scope:features"]);
  assert.equal(v[0].target, "b");
});

test("feature-platform -> account-data source is forbidden", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:features", "type:feature-platform"] },
      { name: "b", tags: ACCOUNT_DATA_SOURCE_TAGS },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].sourceTags, ["scope:features"]);
});

test("domain-api -> account-data source is forbidden", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:domain", "type:domain-api"] },
      { name: "b", tags: ACCOUNT_DATA_SOURCE_TAGS },
    ],
    [{ source: "a", target: "b" }],
  );
  const v = findViolations(graph);
  assert.equal(v.length, 1);
  assert.ok(v[0].sourceTags.includes("scope:domain"));
});

test("devtools -> account-data source is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ["scope:devtools"] },
      { name: "b", tags: ACCOUNT_DATA_SOURCE_TAGS },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("account-data source -> feature-platform is allowed", () => {
  const graph = buildGraph(
    [
      { name: "a", tags: ACCOUNT_DATA_SOURCE_TAGS },
      { name: "b", tags: ["scope:features", "type:feature-platform"] },
    ],
    [{ source: "a", target: "b" }],
  );
  assert.deepEqual(findViolations(graph), []);
});

test("findViolations: BOUNDARY_EXCEPTIONS skips a notDependOnLibsWithTags edge", () => {
  const graph = {
    nodes: {
      a: { data: { root: "features/flow/a", tags: ["scope:features", "type:feature-flow"] } },
      b: { data: { root: "features/platform/account-source-b", tags: ACCOUNT_DATA_SOURCE_TAGS } },
    },
    dependencies: { a: [{ target: "b" }], b: [] },
  };
  const exceptions = [
    {
      sourceRoot: "features/flow/a",
      targetRoot: "features/platform/account-source-b",
      allowedImport: "@features/platform-account-source-b",
    },
  ];
  assert.deepEqual(findViolations(graph, exceptions), []);
  assert.equal(findViolations(graph, []).length, 1);
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

test("BANNED_DEPENDENCIES bans @ledgerhq/generators from every manifest but its own", t => {
  const manifests = {
    "devtools/registry": {
      name: "@devtools/registry",
      devDependencies: { "@ledgerhq/generators": "workspace:*" },
    },
    "apps/app": { name: "app", dependencies: { "@ledgerhq/generators": "workspace:*" } },
    "tools/nx-plugins/generators": { name: "@ledgerhq/generators" },
  };
  const root = makeTmpWorkspace(
    Object.fromEntries(
      Object.entries(manifests).map(([r, pkg]) => [`${r}/package.json`, JSON.stringify(pkg)]),
    ),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const violations = findBannedDependencyViolations(
    bannedDepGraph(manifests),
    root,
    BANNED_DEPENDENCIES,
  );
  assert.deepEqual(violations.map(v => `${v.manifest} ${v.dependency} ${v.field}`).sort(), [
    `${path.join("apps/app", "package.json")} @ledgerhq/generators dependencies`,
    `${path.join("devtools/registry", "package.json")} @ledgerhq/generators devDependencies`,
  ]);
});

test("every manifest check fails on a malformed or unreadable manifest in its scope", t => {
  const root = makeTmpWorkspace({
    "libs/broken/package.json": '{ "name": "@ledgerhq/broken",',
    "devtools/broken/package.json": '{ "name": "@devtools/broken",',
    // a directory where the manifest should be: present, but not readable as a file
    "libs/unreadable/package.json/.keep": "",
    "devtools/unreadable/package.json/.keep": "",
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const tags = ["scope:libs", "type:domain-entity"];
  const checks = [
    { scope: "libs", check: graph => collectLegacyPackageNames(graph, root) },
    { scope: "libs", check: graph => findBannedDependencyViolations(graph, root, BANNED) },
    {
      scope: "libs",
      check: graph =>
        findBannedExternalViolations(graph, root, [{ sourceTag: tags[1], packages: ["react"] }]),
    },
    { scope: "devtools", check: graph => findDevtoolsImportViolations(graph, root, {}) },
  ];
  for (const { scope, check } of checks) {
    for (const [name, error] of [
      ["broken", new RegExp(`${scope}/broken/package\\.json`)],
      ["unreadable", { code: "EISDIR" }],
    ]) {
      const graph = {
        nodes: { p: { data: { root: `${scope}/${name}`, tags } } },
        dependencies: {},
      };
      assert.throws(() => check(graph), error);
    }
  }
});

test("devtools: manifests outside devtools/ are not read", t => {
  const root = makeTmpWorkspace({
    "libs/broken/package.json": '{ "name": "@ledgerhq/broken",',
    "apps/unreadable/package.json/.keep": "",
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const graph = {
    nodes: {
      broken: { data: { root: "libs/broken" } },
      unreadable: { data: { root: "apps/unreadable" } },
    },
    dependencies: { broken: [{ target: "unreadable" }] },
  };
  assert.deepEqual(findDevtoolsImportViolations(graph, root, {}), []);
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
    DEVTOOLS_LAZY_IMPORTS,
  );
}

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

test("devtools: @devtools/bindings importing a tool's values by relative path is forbidden", t => {
  const { root, graph } = manifestWorkspace(
    t,
    DEVTOOLS_MANIFESTS,
    [["devtools/bindings", "devtools/env"]],
    {
      "devtools/bindings/src/types.ts": 'import type { EnvDevToolProps } from "../../env/src";',
      "devtools/bindings/src/useEnv.ts": 'import EnvDevTool from "../../env/src/index";',
      "devtools/bindings/src/local.ts": 'import { useEnv } from "./useEnv";',
      "devtools/bindings/src/sibling.ts": 'import { x } from "../../environment/src";',
    },
  );
  assert.deepEqual(
    devtoolsViolations(graph, root).map(v => v.file),
    [path.join("devtools/bindings/src/useEnv.ts")],
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

test("devtools: each source file is read and parsed once across type-only edges", t => {
  const { root, graph } = manifestWorkspace(
    t,
    DEVTOOLS_MANIFESTS,
    [
      ["devtools/bindings", "devtools/env"],
      ["devtools/bindings", "devtools/feature-flags"],
      ["devtools/bindings", "devtools/relay"],
    ],
    {
      "devtools/bindings/src/env.ts": 'import { EnvDevTool } from "@devtools/env";',
      "devtools/bindings/src/flags.ts": 'import type { Flags } from "@devtools/feature-flags";',
      "devtools/bindings/src/relay.ts": 'export const load = () => import("@devtools/relay");',
    },
  );
  const parse = t.mock.method(sourceFiles, "parse");

  const violations = findDevtoolsImportViolations(
    graph,
    root,
    DEVTOOLS_ALLOWED_IMPORTS,
    DEVTOOLS_TYPE_ONLY_IMPORTS,
  );

  assert.deepEqual(
    parse.mock.calls.map(call => call.arguments[0]).sort(),
    ["env.ts", "flags.ts", "relay.ts"].map(f => path.join(root, "devtools/bindings/src", f)),
  );
  assert.deepEqual(violations.map(v => `${v.target} ${v.file}`).sort(), [
    `@devtools/env ${path.join("devtools/bindings/src/env.ts")}`,
    `@devtools/relay ${path.join("devtools/bindings/src/relay.ts")}`,
  ]);
});

test("devtools: @devtools/registry importing a tool's values is forbidden", t => {
  const { root, graph } = manifestWorkspace(
    t,
    DEVTOOLS_MANIFESTS,
    [["devtools/registry", "devtools/env"]],
    {
      "devtools/registry/src/registry.ts": [
        'import type { EnvDevToolProps } from "@devtools/env";',
        'import EnvDevTool from "@devtools/env";',
        'const env = require("@devtools/env");',
      ].join("\n"),
    },
  );
  assert.deepEqual(devtoolsViolations(graph, root), [
    {
      source: "@devtools/registry",
      target: "@devtools/env",
      file: path.join("devtools/registry/src/registry.ts"),
      line: 2,
      specifier: "@devtools/env",
      rule: "DEVTOOLS_LAZY_RULE",
    },
    {
      source: "@devtools/registry",
      target: "@devtools/env",
      file: path.join("devtools/registry/src/registry.ts"),
      line: 3,
      specifier: "@devtools/env",
      rule: "DEVTOOLS_LAZY_RULE",
    },
  ]);
});

test("devtools: @devtools/registry may reach a tool through import() and type imports", t => {
  const { root, graph } = manifestWorkspace(
    t,
    DEVTOOLS_MANIFESTS,
    [["devtools/registry", "devtools/env"]],
    {
      "devtools/registry/src/metadata/env.ts": [
        'import type { EnvDevToolProps } from "@devtools/env";',
        'export type { EnvVarEntry } from "@devtools/env";',
        'type Loader = typeof import("@devtools/env");',
        'export const loader = () => import("@devtools/env");',
      ].join("\n"),
    },
  );
  assert.deepEqual(devtoolsViolations(graph, root), []);
});

test("devtools: a violation names the file, the line, the specifier and the rule", () => {
  assert.equal(
    formatDevtoolsImportViolation({
      source: "@devtools/registry",
      target: "@devtools/env",
      file: "devtools/registry/src/registry.ts",
      line: 2,
      specifier: "@devtools/env",
      rule: "DEVTOOLS_LAZY_RULE",
    }),
    '@devtools/registry  →  @devtools/env  (devtools/registry/src/registry.ts:2 imports "@devtools/env", breaks DEVTOOLS_LAZY_RULE)',
  );
  assert.equal(
    formatDevtoolsHostViolation({
      file: "apps/ledger-live-desktop/src/config/a.ts",
      line: 1,
      specifier: "@devtools/shell",
      rule: "DEVTOOLS_HOST_APP_RULE",
    }),
    "apps/ledger-live-desktop/src/config/a.ts:1  →  @devtools/shell  (breaks DEVTOOLS_HOST_APP_RULE)",
  );
});

// --- devtools host apps ---

const LLD = "apps/ledger-live-desktop";
const LLM = "apps/ledger-live-mobile";
const LLD_DEVTOOLS = `${LLD}/src/mvvm/features/DevTools`;
const LLM_DEVTOOLS = `${LLM}/src/mvvm/features/DevTools`;

/**
 * A workspace holding both host apps, with their tsconfig path aliases, plus `files`.
 *
 * @param {import("node:test").TestContext} t
 * @param {Record<string, string>} files keyed by workspace-relative path
 */
function hostWorkspace(t, files) {
  const tsconfig = alias =>
    JSON.stringify({
      compilerOptions: { paths: { "*": ["./*"], "~/*": ["./src/*"], [alias]: ["./src/mvvm/*"] } },
    });
  const root = makeTmpWorkspace({
    [`${LLD}/tsconfig.json`]: tsconfig("LLD/*"),
    [`${LLM}/tsconfig.json`]: tsconfig("LLM/*"),
    ...files,
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

/**
 * Violations of the host-app rules, as `file:line specifier rule`, sorted.
 *
 * @param {string} root
 */
function hostViolations(root) {
  return findDevtoolsHostViolations(root, DEVTOOLS_HOST_APPS)
    .map(v => `${v.file.split(path.sep).join("/")}:${v.line} ${v.specifier} ${v.rule}`)
    .sort();
}

test("devtools host apps: product code importing @devtools/shell is forbidden, value or type", t => {
  const root = hostWorkspace(t, {
    [`${LLD}/src/config/devtools.ts`]: [
      'import { DevTools } from "@devtools/shell";',
      'import type { DevToolsConfig } from "@devtools/shell";',
    ].join("\n"),
    [`${LLM}/src/screens/Debug.tsx`]: 'import type { DevToolsConfig } from "@devtools/shell";',
  });
  assert.deepEqual(hostViolations(root), [
    `${LLD}/src/config/devtools.ts:1 @devtools/shell DEVTOOLS_HOST_APP_RULE`,
    `${LLD}/src/config/devtools.ts:2 @devtools/shell DEVTOOLS_HOST_APP_RULE`,
    `${LLM}/src/screens/Debug.tsx:1 @devtools/shell DEVTOOLS_HOST_APP_RULE`,
  ]);
});

test("devtools host apps: the DevTools folder may import @devtools/shell, value or type", t => {
  const root = hostWorkspace(t, {
    [`${LLD_DEVTOOLS}/screens/DevToolsScreen/index.tsx`]: [
      'import { DevTools } from "@devtools/shell";',
      'import type { DevToolsConfig } from "@devtools/shell";',
    ].join("\n"),
    [`${LLM_DEVTOOLS}/screens/DevToolsScreen/index.tsx`]:
      'import type { DevToolsConfig } from "@devtools/shell";',
  });
  assert.deepEqual(hostViolations(root), []);
});

/** The coupling the device-onboarding split removed from product code, under `dir`. */
const deviceOnboardingCoupling = dir => ({
  [`${dir}/hooks/useDeviceOnboarding.ts`]:
    'import { useDeviceOnboardingActor } from "@devtools/bindings";',
  [`${dir}/utils/toolState.ts`]: [
    'import type { DevToolsConfig } from "@devtools/shell";',
    'export type ToolState = Extract<DevToolsConfig[number], { id: "device-onboarding" }>["config"];',
  ].join("\n"),
  [`${dir}/utils/ports.ts`]: 'import type { DeviceOnboardingPorts } from "@devtools/bindings";',
});

test("devtools host apps: a product feature coupled to @devtools/* is forbidden", t => {
  const root = hostWorkspace(t, {
    ...deviceOnboardingCoupling(`${LLD}/src/mvvm/features/DeviceOnboarding`),
    ...deviceOnboardingCoupling(`${LLM}/src/mvvm/features/DeviceOnboarding`),
  });
  assert.deepEqual(
    hostViolations(root),
    [LLD, LLM]
      .flatMap(app => [
        `${app}/src/mvvm/features/DeviceOnboarding/hooks/useDeviceOnboarding.ts:1 @devtools/bindings DEVTOOLS_HOST_APP_RULE`,
        `${app}/src/mvvm/features/DeviceOnboarding/utils/ports.ts:1 @devtools/bindings DEVTOOLS_HOST_APP_RULE`,
        `${app}/src/mvvm/features/DeviceOnboarding/utils/toolState.ts:1 @devtools/shell DEVTOOLS_HOST_APP_RULE`,
      ])
      .sort(),
  );
});

test("devtools host apps: the same coupling inside the DevTools folder is allowed", t => {
  const root = hostWorkspace(t, {
    ...deviceOnboardingCoupling(`${LLD_DEVTOOLS}/DeviceOnboarding`),
    ...deviceOnboardingCoupling(`${LLM_DEVTOOLS}/DeviceOnboarding`),
  });
  assert.deepEqual(hostViolations(root), []);
});

test("devtools host apps: a relative path into devtools/ is forbidden", t => {
  const root = hostWorkspace(t, {
    [`${LLD}/src/config/devtools.ts`]: 'import { DevTools } from "../../../../devtools/shell/src";',
  });
  assert.deepEqual(hostViolations(root), [
    `${LLD}/src/config/devtools.ts:1 ../../../../devtools/shell/src DEVTOOLS_HOST_APP_RULE`,
  ]);
});

const NON_ENTRY = "screens/DevToolsScreen/useDevToolsScreenViewModel";

test("devtools host apps: a static import of a non-entry DevTools file is forbidden", t => {
  const root = hostWorkspace(t, {
    [`${LLD_DEVTOOLS}/${NON_ENTRY}.ts`]: "export const x = 1;",
    [`${LLM_DEVTOOLS}/${NON_ENTRY}.ts`]: "export const x = 1;",
    [`${LLD}/src/mvvm/features/Settings/relative.ts`]: `import { x } from "../DevTools/${NON_ENTRY}";`,
    [`${LLD}/src/renderer/aliased.ts`]: [
      `import { x } from "LLD/features/DevTools/${NON_ENTRY}";`,
      `import type { X } from "~/mvvm/features/DevTools/${NON_ENTRY}";`,
      `export { x } from "LLD/features/DevTools";`,
    ].join("\n"),
    [`${LLM}/src/components/aliased.ts`]: [
      `import { x } from "LLM/features/DevTools/${NON_ENTRY}";`,
      `const y = require("~/mvvm/features/DevTools/${NON_ENTRY}");`,
    ].join("\n"),
  });
  assert.deepEqual(hostViolations(root), [
    `${LLD}/src/mvvm/features/Settings/relative.ts:1 ../DevTools/${NON_ENTRY} DEVTOOLS_HOST_FOLDER_RULE`,
    `${LLD}/src/renderer/aliased.ts:1 LLD/features/DevTools/${NON_ENTRY} DEVTOOLS_HOST_FOLDER_RULE`,
    `${LLD}/src/renderer/aliased.ts:2 ~/mvvm/features/DevTools/${NON_ENTRY} DEVTOOLS_HOST_FOLDER_RULE`,
    `${LLD}/src/renderer/aliased.ts:3 LLD/features/DevTools DEVTOOLS_HOST_FOLDER_RULE`,
    `${LLM}/src/components/aliased.ts:1 LLM/features/DevTools/${NON_ENTRY} DEVTOOLS_HOST_FOLDER_RULE`,
    `${LLM}/src/components/aliased.ts:2 ~/mvvm/features/DevTools/${NON_ENTRY} DEVTOOLS_HOST_FOLDER_RULE`,
  ]);
});

test("devtools host apps: import() and lazy(() => import()) of a DevTools file are allowed", t => {
  const root = hostWorkspace(t, {
    [`${LLD}/src/renderer/Default.tsx`]: [
      'import { lazy } from "react";',
      `const Screen = lazy(() => import("LLD/features/DevTools/screens/DevToolsScreen"));`,
      `const load = () => import("../mvvm/features/DevTools/${NON_ENTRY}");`,
    ].join("\n"),
    [`${LLM}/src/components/Nav.tsx`]: `const load = () => import("~/mvvm/features/DevTools/${NON_ENTRY}");`,
  });
  assert.deepEqual(hostViolations(root), []);
});

test("devtools host apps: a static import of a declared entry is allowed", t => {
  const root = hostWorkspace(t, {
    [`${LLD}/src/renderer/App.tsx`]:
      'import { DevToolsWindow } from "LLD/features/DevTools/components/DevToolsWindow";',
    [`${LLD}/src/mvvm/components/TopBar/hooks/useDevTools.ts`]: [
      'import { openDevToolsWindow } from "LLD/features/DevTools/components/DevToolsWindow/devToolsWindow";',
      'import { DevToolsWindow } from "~/mvvm/features/DevTools/components/DevToolsWindow/index.tsx";',
    ].join("\n"),
    [`${LLM}/src/components/RootNavigator/SettingsNavigator.tsx`]:
      'import DebugDevTools from "LLM/features/DevTools/screens/DevToolsScreen";',
  });
  assert.deepEqual(hostViolations(root), []);
});

test("devtools host apps: test files outside the DevTools folder may import any DevTools file", t => {
  const statement = `import { x } from "LLD/features/DevTools/${NON_ENTRY}";`;
  const root = hostWorkspace(t, {
    [`${LLD}/src/renderer/App.test.tsx`]: statement,
    [`${LLD}/src/renderer/__tests__/App.tsx`]: statement,
    [`${LLD}/src/renderer/__integrations__/App.tsx`]: statement,
  });
  assert.deepEqual(hostViolations(root), []);
});

test("devtools host apps: files under skipped directories are not read", t => {
  const root = hostWorkspace(t, {
    [`${LLD}/node_modules/x/index.js`]: 'require("@devtools/shell");',
    [`${LLM}/build/index.js`]: 'require("@devtools/shell");',
  });
  assert.deepEqual(hostViolations(root), []);
});

// --- lint:boundaries cache inputs ---

const fixedSourceRoots = [...LEGACY_SOURCE_ROOTS, DEVTOOLS_ROOT];

test("lint:boundaries inputs cover every source file under the legacy and devtools roots", () => {
  assertSourceFilesHashed(fixedSourceRoots);
});

test("lint:boundaries inputs exclude each skipped directory under the legacy and devtools roots", () => {
  assertSkipDirsExcluded(fixedSourceRoots);
});

test("lint:boundaries inputs cover every source file and the tsconfig of each devtools host app", () => {
  const appRoots = DEVTOOLS_HOST_APPS.map(app => app.root);
  assertSourceFilesHashed(appRoots);
  assertSkipDirsExcluded(appRoots);
  assert.deepEqual(
    appRoots.map(r => `${r}/tsconfig.json`).filter(file => !isLintBoundariesInput(file)),
    [],
  );
});

test("lint:boundaries inputs cover the graph configuration and the tags plugin", () => {
  const files = [
    "pnpm-workspace.yaml",
    "nx.json",
    "nx.cache-config.json",
    "tools/nx-plugins/project-tags/plugin.js",
    "tools/nx-plugins/enforce-boundaries/constraints.js",
    "tools/nx-plugins/enforce-boundaries/validate.js",
  ];
  assert.deepEqual(
    files.filter(file => !isLintBoundariesInput(file)),
    [],
  );
});
