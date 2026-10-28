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
      new RegExp(
        `^Error: ${name}\\(\\): transformIgnorePatterns belongs to the preset: keep a dependency ` +
          "transformed with the extraEsmDeps option",
      ),
    );
    assert.throws(() => create({ reporters: ["default"] }), /reporters belongs to the preset/);
  });
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
  const presetKeys = new Set([
    "transform",
    "transformIgnorePatterns",
    "testEnvironment",
    "globals",
    "reporters",
    "coverageReporters",
  ]);
  for (const [pkg, { reason, overrides }] of Object.entries(PRESET_OVERRIDES)) {
    assert.ok(fs.existsSync(path.join(at(pkg), "package.json")), `${pkg} is not a package`);
    assert.ok(reason, `${pkg} has no reason`);
    for (const [factory, keys] of Object.entries(overrides)) {
      assert.ok(factories.has(factory), `${pkg}: ${factory} is not a preset factory`);
      for (const key of keys) assert.ok(presetKeys.has(key), `${pkg}: ${key} is not a preset key`);
    }
  }
});
