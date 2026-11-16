import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import sourceOnly, { CHECKS, check } from "./source-only.mjs";
import { SOURCE_ONLY_DEBT } from "./source-only-debt.mjs";

const WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const PRIVATE_LIB = {
  name: "@ledgerhq/pkg",
  private: true,
  main: "src/index.ts",
  types: "src/index.ts",
  exports: { ".": "./src/index.ts", "./*": "./src/*.ts" },
  scripts: { test: "jest" },
};

const PUBLISHED_LIB = {
  name: "@ledgerhq/published",
  main: "lib/index.js",
  module: "lib-es/index.js",
  exports: {
    ".": { "@ledgerhq/source": "./src/index.ts", require: "./lib/index.js" },
  },
  scripts: { build: "tsc" },
};

/** @type {string[]} */
const workspaces = [];

after(() => {
  for (const root of workspaces) fs.rmSync(root, { recursive: true, force: true });
});

/**
 * @param {Record<string, string | object>} files paths relative to the workspace root; an object
 *   is written as JSON
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-source-only-test-"));
  workspaces.push(root);
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content));
  }
  return root;
}

/**
 * @param {Record<string, string | object>} files
 * @param {{ projectRoot?: string, debt?: object }} [options]
 * @returns {Array<{ file: string, message: string }>}
 */
function violations(files, { projectRoot = "libs/pkg", debt = {} } = {}) {
  return check({ workspaceRoot: workspace(files), projectRoot }, { debt });
}

/**
 * @param {Array<{ message: string }>} found
 * @returns {string[]} the part of each message after the check description
 */
function problems(found) {
  return found.map(({ message }) => message.slice(message.indexOf("; ") + 2));
}

test("a source-only private library passes", () => {
  assert.deepEqual(violations({ "libs/pkg/package.json": PRIVATE_LIB }), []);
});

test("no-build: a private library with a build script, project target or nx target fails", () => {
  const found = violations({
    "libs/pkg/package.json": {
      ...PRIVATE_LIB,
      scripts: { build: "tsc" },
      nx: { targets: { build: { executor: "nx:noop" } } },
    },
    "libs/pkg/project.json": { targets: { build: { executor: "nx:noop" } } },
  });
  assert.deepEqual(
    found.map(({ file }) => file),
    ["libs/pkg/package.json", "libs/pkg/package.json", "libs/pkg/project.json"],
  );
  for (const { message } of found) assert.ok(message.startsWith(CHECKS["no-build"]));
});

test("no-build: a private package outside libs/ and a published library may build", () => {
  const manifest = { ...PRIVATE_LIB, scripts: { build: "tsc" } };
  assert.deepEqual(
    violations({ "shared/pkg/package.json": manifest }, { projectRoot: "shared/pkg" }),
    [],
  );
  assert.deepEqual(
    violations({ "libs/pkg/package.json": { ...manifest, private: undefined } }),
    [],
  );
});

test("exports-to-src: exports and entry fields pointing at lib/ or lib-es/ fail", () => {
  const found = violations({
    "libs/pkg/package.json": {
      ...PRIVATE_LIB,
      main: "lib/index.js",
      module: "./lib-es/index.js",
      types: "lib/index.d.ts",
      sideEffects: ["lib/register.js"],
      typesVersions: { "*": { "*": ["lib/*"] } },
      exports: { ".": { import: "./lib-es/index.js", default: "./src/index.ts" } },
    },
  });
  assert.deepEqual(problems(found), [
    'exports["."]["import"] is "./lib-es/index.js": point it at src',
    'main is "lib/index.js": point it at src',
    'module is "./lib-es/index.js": point it at src',
    'types is "lib/index.d.ts": point it at src',
    'typesVersions["*"]["*"][0] is "lib/*": point it at src',
    'sideEffects[0] is "lib/register.js": point it at src',
  ]);
});

test("exports-to-src: a @ledgerhq/source condition or an array target fails", () => {
  const found = violations({
    "libs/pkg/package.json": {
      ...PRIVATE_LIB,
      exports: {
        ".": { "@ledgerhq/source": "./src/index.ts", default: "./src/index.ts" },
        "./*": ["./src/*.ts", "./src/*.tsx"],
      },
    },
  });
  assert.deepEqual(problems(found), [
    'exports["."] has a "@ledgerhq/source" condition: point the entry itself at src and drop ' +
      "the condition",
    'exports["./*"] is an array: make it a single target',
  ]);
});

test("exports-to-src: a published library keeps its build outputs and source condition", () => {
  assert.deepEqual(violations({ "libs/pkg/package.json": PUBLISHED_LIB }), []);
});

test("published-deps: a published package depending on a private workspace package fails", () => {
  const found = violations({
    "libs/pkg/package.json": {
      ...PUBLISHED_LIB,
      dependencies: { "@ledgerhq/private": "workspace:^", "@ledgerhq/public": "workspace:^" },
    },
    "libs/pkg/node_modules/@ledgerhq/private/package.json": PRIVATE_LIB,
    "libs/pkg/node_modules/@ledgerhq/public/package.json": PUBLISHED_LIB,
  });
  assert.deepEqual(found, [
    {
      file: "libs/pkg/package.json",
      message:
        `${CHECKS["published-deps"]}; dependencies has "@ledgerhq/private", which is private ` +
        "and has no build: move it to devDependencies, or publish it",
    },
  ]);
});

test("published-deps: private workspace packages in devDependencies or of a private one pass", () => {
  const privateDep = { "libs/pkg/node_modules/@ledgerhq/private/package.json": PRIVATE_LIB };
  assert.deepEqual(
    violations({
      "libs/pkg/package.json": {
        ...PUBLISHED_LIB,
        devDependencies: { "@ledgerhq/private": "workspace:^" },
      },
      ...privateDep,
    }),
    [],
  );
  assert.deepEqual(
    violations({
      "libs/pkg/package.json": {
        ...PRIVATE_LIB,
        dependencies: { "@ledgerhq/private": "workspace:^" },
      },
      ...privateDep,
    }),
    [],
  );
});

test("no-source-condition: Jest and rspack configs setting @ledgerhq/source fail", () => {
  const found = violations({
    "libs/pkg/package.json": PRIVATE_LIB,
    "libs/pkg/jest.config.js":
      'module.exports = { testEnvironmentOptions: { customExportConditions: ["node", ' +
      '"@ledgerhq/source"] } };\n',
    "libs/pkg/jest.integ.config.ts": "export default {};\n",
    "libs/pkg/rspack.config.mjs":
      "export default { resolve: { conditionNames: ['@ledgerhq/source', 'import'] } };\n",
  });
  assert.deepEqual(
    found.map(({ file, message }) => [file, message.startsWith(CHECKS["no-source-condition"])]),
    [
      ["libs/pkg/jest.config.js", true],
      ["libs/pkg/rspack.config.mjs", true],
    ],
  );
});

test("no-source-condition: split rspack configs under tools/rspack fail", () => {
  const found = violations(
    {
      "apps/desktop/package.json": { ...PRIVATE_LIB, scripts: { build: "rspack" } },
      "apps/desktop/tools/rspack/rspack.common.mts":
        'export default { resolve: { conditionNames: ["@ledgerhq/source", "import"] } };\n',
      "apps/desktop/tools/rspack/rspack.main.mts": "export default {};\n",
      "apps/desktop/tools/rspack/helpers.mts":
        'export const conditionNames: ["@ledgerhq/source"] = ["@ledgerhq/source"];\n',
    },
    { projectRoot: "apps/desktop" },
  );
  assert.deepEqual(
    found.map(({ file, message }) => [file, message.startsWith(CHECKS["no-source-condition"])]),
    [["apps/desktop/tools/rspack/rspack.common.mts", true]],
  );
});

test("no-source-condition: configs that only mention the condition pass", () => {
  assert.deepEqual(
    violations({
      "libs/pkg/package.json": PRIVATE_LIB,
      "libs/pkg/jest.config.js":
        "// @ledgerhq/source is not needed here\n" +
        'module.exports = { testEnvironmentOptions: { customExportConditions: ["node"] } };\n',
    }),
    [],
  );
});

test("a debt entry silences the checks it lists, and only those", () => {
  const files = {
    "libs/pkg/package.json": { ...PRIVATE_LIB, main: "lib/index.js", scripts: { build: "tsc" } },
  };
  assert.deepEqual(
    violations(files, { debt: { "libs/pkg": { checks: ["no-build"], reason: "test" } } }).map(
      ({ message }) => message.startsWith(CHECKS["exports-to-src"]),
    ),
    [true],
  );
});

test("a debt entry the package no longer needs is reported", () => {
  assert.deepEqual(
    violations(
      { "libs/pkg/package.json": PRIVATE_LIB },
      { debt: { "libs/pkg": { checks: ["no-build"], reason: "test" } } },
    ),
    [
      {
        file: "tools/nx-plugins/enforce-tool-config/rules/source-only-debt.mjs",
        message: 'lists "no-build" for libs/pkg, which the package now passes; remove it',
      },
    ],
  );
});

test("every debt entry names a known check and says when it goes", () => {
  for (const [projectRoot, { checks, reason }] of Object.entries(SOURCE_ONLY_DEBT)) {
    assert.ok(checks.length > 0, projectRoot);
    for (const name of checks) assert.ok(name in CHECKS, `${projectRoot}: ${name}`);
    assert.match(reason, /Exit condition: /, projectRoot);
  }
});

test("every debt entry is still needed in this workspace", () => {
  const stale = Object.keys(SOURCE_ONLY_DEBT).flatMap(projectRoot =>
    sourceOnly.check({ workspaceRoot: WORKSPACE_ROOT, projectRoot }).map(({ message }) => message),
  );
  assert.deepEqual(stale, []);
});
