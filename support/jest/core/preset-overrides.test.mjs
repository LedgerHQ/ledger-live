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
const { ALLOWLIST_FIX, ESM_FIX, PRESET_KEYS, presetFactories } = require(".");
// Loading the presets registers their factories.
const PRESETS = ["shared", "features-flow", "libs-coin", "devtools"].map(name => [
  name,
  require(`../${name}`),
]);
const { createSharedJestConfig } = require("../shared");
const {
  createLibsCoinJestConfig,
  createLibsCoinIntegJestConfig,
  createLibsCoinJestProject,
} = require("../libs-coin");

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
/**
 * @param {string} pkg a package path from the repository root
 * @returns {string} its absolute path
 */
function at(pkg) {
  return path.join(repository, pkg);
}

const FACTORIES = presetFactories();
// A value each option accepts, for the factories that read it.
const OPTION_SAMPLES = { esm: true, extraEsmDeps: ["@scure"], projectRoot: "../../../" };

test("every factory a preset exports is built by presetFactory", () => {
  const registered = new Map(FACTORIES.map(({ name, factory }) => [name, factory]));
  for (const [preset, exports] of PRESETS) {
    for (const [name, value] of Object.entries(exports)) {
      if (/^create\w*(Config|Project)$/.test(name)) {
        assert.equal(
          registered.get(name),
          value,
          `${preset}: ${name} is not built by presetFactory`,
        );
      }
    }
  }
});

for (const { name, factory: create, options } of FACTORIES) {
  test(`${name}: the keys a package owns pass, a key the preset owns throws with its fix`, () => {
    assert.doesNotThrow(() => create({ rootDir: at("shared/thing"), testMatch: ["**/*.spec.ts"] }));
    assert.throws(() => create({ reporters: ["default"] }), {
      message: new RegExp(`^${escape(`${name}(): reporters belongs to the preset: `)}`),
    });
    assert.throws(() => create({ nativeOverrides: { testEnvironment: "jsdom" } }), {
      message: new RegExp(`^${escape(`${name}(): nativeOverrides.testEnvironment belongs`)}`),
    });
  });

  // The fix for a transform override names extraEsmDeps where the factory reads that option, the
  // preset's transform allowlist elsewhere.
  test(`${name}: a transform override names a fix the factory takes`, () => {
    const fix = options.includes("extraEsmDeps") ? ESM_FIX : ALLOWLIST_FIX;
    for (const [overrides, label] of [
      [{ transform: {} }, "transform"],
      [{ webOverrides: { transformIgnorePatterns: [] } }, "webOverrides.transformIgnorePatterns"],
    ]) {
      const message = `${name}(): ${label} belongs to the preset: ${fix}.`;
      assert.throws(() => create(overrides), { message: new RegExp(`^${escape(message)}`) });
    }
  });

  test(`${name}: it takes the options it reads, and throws on any other`, () => {
    for (const option of options) {
      assert.doesNotThrow(() => create({}, { [option]: OPTION_SAMPLES[option] }), option);
    }
    const reads = options.length ? options.map(option => `\`${option}\``).join(", ") : "none";
    assert.throws(() => create({}, { network: true }), {
      message: `${name}(): it does not read the option "network"; its options: ${reads}.`,
    });
  });
}

/**
 * @param {string} text
 * @returns {string} the text, escaped for a regular expression
 */
function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const factories = new Set(FACTORIES.map(({ name }) => name));
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

test("createLibsCoinJestProject reads no projectRoot: jest takes the lcov root from the top level", () => {
  assert.throws(
    () => createLibsCoinJestProject({}, { projectRoot: "../../../" }),
    /it does not read the option "projectRoot"; its options: `esm`, `extraEsmDeps`\./,
  );
});

test("the exported tables are frozen", () => {
  assert.ok(Object.isFrozen(PRESET_KEYS));
  assert.ok(Object.isFrozen(PRESET_OVERRIDES));
  for (const { overrides } of Object.values(PRESET_OVERRIDES)) {
    assert.ok(Object.isFrozen(overrides));
    for (const keys of Object.values(overrides)) assert.ok(Object.isFrozen(keys));
  }
});

test("projects accept only what a preset project factory returned", () => {
  const unit = createLibsCoinJestProject({ displayName: "unit" });
  assert.doesNotThrow(() => createLibsCoinJestConfig({ projects: [unit] }));

  const notBuilt =
    "projects[1] is not built by a preset project factory: use createLibsCoinJestProject().";
  assert.throws(() => createLibsCoinJestConfig({ projects: [unit, { displayName: "raw" }] }), {
    message: `createLibsCoinJestConfig(): ${notBuilt}`,
  });
  // A copy is not the factory's result, whatever its shape.
  assert.throws(() => createSharedJestConfig({ projects: [unit, { ...unit }] }), {
    message: `createSharedJestConfig(): ${notBuilt}`,
  });
  // The project factory checks its own overrides.
  assert.throws(() => createLibsCoinJestProject({ transform: {} }), {
    message: /^createLibsCoinJestProject\(\): transform belongs to the preset/,
  });
});

test("the registry marks the project factories", () => {
  const projectFactories = FACTORIES.filter(({ project }) => project).map(({ name }) => name);
  assert.deepEqual(projectFactories, ["createLibsCoinJestProject"]);
});
