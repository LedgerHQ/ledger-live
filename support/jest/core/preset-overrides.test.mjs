// Pins the check every preset factory runs on its overrides: a key the preset owns throws, unless
// preset-overrides.js lists it for the package (found from rootDir) and the factory, and a listed
// key the overrides no longer set throws too.

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const PRESET_OVERRIDES = require("./preset-overrides");
const { PRESET_KEYS } = require(".");
const {
  createSharedJestConfig,
  createSharedUiJestConfig,
  createSharedUiNativeJestConfig,
} = require("../shared");
const { createFlowJestConfig, createFlowNativeJestConfig } = require("../features-flow");
const {
  createLibsCoinJestConfig,
  createLibsCoinIntegJestConfig,
  createLibsCoinJestProject,
} = require("../libs-coin");
const { createWebJestConfig, createNativeJestConfig } = require("../devtools");

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const at = pkg => path.join(repository, pkg);

const flat = [
  ["createSharedJestConfig", createSharedJestConfig],
  ["createSharedUiNativeJestConfig", createSharedUiNativeJestConfig],
  ["createLibsCoinJestConfig", createLibsCoinJestConfig],
  ["createLibsCoinIntegJestConfig", createLibsCoinIntegJestConfig],
  ["createLibsCoinJestProject", createLibsCoinJestProject],
  ["createWebJestConfig", createWebJestConfig],
  ["createNativeJestConfig", createNativeJestConfig],
];
const dual = [
  ["createSharedUiJestConfig", createSharedUiJestConfig],
  ["createFlowJestConfig", createFlowJestConfig],
  ["createFlowNativeJestConfig", createFlowNativeJestConfig],
];

for (const [name, create] of flat) {
  test(`${name}: the keys a package owns pass, a key the preset owns throws with its fix`, () => {
    assert.doesNotThrow(() => create({ rootDir: at("shared/thing"), testMatch: ["**/*.spec.ts"] }));
    assert.throws(
      () => create({ transformIgnorePatterns: ["node_modules/(?!x)"] }),
      new RegExp(`^Error: ${name}\\(\\): transformIgnorePatterns belongs to the preset: `),
    );
    assert.throws(() => create({ reporters: ["default"] }), /reporters belongs to the preset/);
  });
}

// A transform override's fix names extraEsmDeps only where the factory reads that option, and
// the transform allowlist elsewhere.
const ESM_FIX = "keep a dependency transformed with the extraEsmDeps option";
const ALLOWLIST_FIX = "add the dependency to the preset's transform allowlist in support/jest";
const TRANSFORM_FIXES = {
  createSharedJestConfig: ESM_FIX,
  createSharedUiNativeJestConfig: ALLOWLIST_FIX,
  createLibsCoinJestConfig: ESM_FIX,
  createLibsCoinIntegJestConfig: ESM_FIX,
  createLibsCoinJestProject: ESM_FIX,
  createWebJestConfig: ALLOWLIST_FIX,
  createNativeJestConfig: ALLOWLIST_FIX,
  createSharedUiJestConfig: ALLOWLIST_FIX,
  createFlowJestConfig: ALLOWLIST_FIX,
  createFlowNativeJestConfig: ALLOWLIST_FIX,
};

for (const [name, create, overrides, label] of [
  ...flat.map(([n, c]) => [n, c, { transform: {} }, "transform"]),
  ...dual.map(([n, c]) => [
    n,
    c,
    { nativeOverrides: { transformIgnorePatterns: [] } },
    "nativeOverrides.transformIgnorePatterns",
  ]),
]) {
  test(`${name}: a transform override names the fix the factory takes`, () => {
    const message = `${name}(): ${label} belongs to the preset: ${TRANSFORM_FIXES[name]}.`;
    assert.throws(() => create(overrides), { message: new RegExp(`^${escape(message)}`) });
  });
}

test("the extraEsmDeps fix is named only by the factories that read the option", () => {
  for (const [name, create] of [...flat, ...dual]) {
    if (TRANSFORM_FIXES[name] === ESM_FIX) {
      assert.doesNotThrow(() => create({}, { extraEsmDeps: ["x"] }), name);
    } else {
      assert.throws(() => create({}, { extraEsmDeps: ["x"] }), /does not read the option/, name);
    }
  }
});

/**
 * @param {string} text
 * @returns {string} the text, escaped for a regular expression
 */
function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const [name, create] of dual) {
  test(`${name}: a key the preset owns throws at the top level and in a project`, () => {
    assert.doesNotThrow(() =>
      create({ passWithNoTests: true, nativeOverrides: { moduleNameMapper: { "^x$": "/x.js" } } }),
    );
    assert.throws(
      () => create({ nativeOverrides: { testEnvironment: "jsdom" } }),
      new RegExp(`^Error: ${name}\\(\\): nativeOverrides\\.testEnvironment belongs to the preset`),
    );
    assert.throws(
      () => create({ globals: {} }),
      new RegExp(`^Error: ${name}\\(\\): globals belongs`),
    );
  });
}

test("a key preset-overrides.js lists for the package and the factory passes through", () => {
  const transform = { "^.+\\.tsx?$": "babel-jest" };
  const i18n = createSharedJestConfig({
    rootDir: at("shared/i18n"),
    testEnvironment: "jsdom",
    transform,
  });
  assert.equal(i18n.testEnvironment, "jsdom");
  assert.deepEqual(i18n.transform, transform);

  const aleo = createLibsCoinIntegJestConfig({
    rootDir: at("libs/coin-modules/coin-aleo"),
    transform,
  });
  assert.equal(aleo.transform["^.+\\.tsx?$"], "babel-jest");

  // Listed for another factory or another package: still the preset's.
  assert.throws(
    () => createLibsCoinJestConfig({ rootDir: at("libs/coin-modules/coin-aleo"), transform }),
    /createLibsCoinJestConfig\(\): transform belongs to the preset/,
  );
  assert.throws(
    () => createSharedJestConfig({ rootDir: at("shared/auth"), transform }),
    /transform belongs to the preset/,
  );
});

test("a key preset-overrides.js lists that the overrides no longer set throws", () => {
  assert.throws(
    () => createSharedJestConfig({ rootDir: at("shared/i18n"), testEnvironment: "jsdom" }),
    /createSharedJestConfig\(\): support\/jest\/core\/preset-overrides\.js lists transform for shared\/i18n, which no override sets; remove it/,
  );
});

test("every entry of preset-overrides.js names a package, a factory, a reason and preset keys", () => {
  const factories = new Set([...flat, ...dual].map(([name]) => name));
  for (const [pkg, { reason, overrides }] of Object.entries(PRESET_OVERRIDES)) {
    assert.ok(fs.existsSync(path.join(at(pkg), "package.json")), `${pkg} is not a package`);
    assert.ok(reason, `${pkg} has no reason`);
    for (const [factory, keys] of Object.entries(overrides)) {
      assert.ok(factories.has(factory), `${pkg}: ${factory} is not a preset factory`);
      for (const key of keys)
        assert.ok(Object.hasOwn(PRESET_KEYS, key), `${pkg}: ${key} is not a preset key`);
    }
  }
});

// The option each factory accepts in these tests; a factory missing here takes none.
const ACCEPTED = {
  createSharedJestConfig: { esm: true },
  createLibsCoinJestConfig: { projectRoot: "../../../" },
  createLibsCoinIntegJestConfig: { extraEsmDeps: ["@scure"] },
  createLibsCoinJestProject: { esm: false },
};

for (const [name, create] of [...flat, ...dual]) {
  test(`${name}: an option it does not read throws, naming the ones it reads`, () => {
    if (ACCEPTED[name]) assert.doesNotThrow(() => create({}, ACCEPTED[name]));
    assert.doesNotThrow(() => create({}, {}));
    assert.throws(
      () => create({}, { network: true }),
      new RegExp(`^Error: ${name}\\(\\): it does not read the option "network"; its options: `),
    );
  });
}

test("createLibsCoinJestProject reads no projectRoot: jest takes the lcov root from the top level", () => {
  assert.throws(
    () => createLibsCoinJestProject({}, { projectRoot: "../../../" }),
    /it does not read the option "projectRoot"; its options: `esm`, `extraEsmDeps`\./,
  );
});
