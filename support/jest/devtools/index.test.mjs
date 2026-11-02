// Pins the override rule of the devtools presets: every key replaces the preset's, and a package
// keeps the preset's mappers and setup files by spreading the exported tables.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  createNativeJestConfig,
  createWebJestConfig,
  nativeModuleNameMapper,
  nativeSetupFilesAfterEnv,
  webModuleNameMapper,
  webSetupFilesAfterEnv,
} = require("./index.js");

const factories = [
  ["createWebJestConfig", createWebJestConfig, webModuleNameMapper, webSetupFilesAfterEnv],
  [
    "createNativeJestConfig",
    createNativeJestConfig,
    nativeModuleNameMapper,
    nativeSetupFilesAfterEnv,
  ],
];

for (const [name, create, mapper, setupFiles] of factories) {
  test(`${name}: the exported mapper and setup files, as unfrozen copies`, () => {
    const { moduleNameMapper, setupFilesAfterEnv } = create();
    assert.deepEqual(moduleNameMapper, mapper);
    assert.deepEqual(setupFilesAfterEnv, setupFiles);
    assert.ok(Object.isFrozen(mapper) && Object.isFrozen(setupFiles));
    assert.ok(!Object.isFrozen(moduleNameMapper) && !Object.isFrozen(setupFilesAfterEnv));
  });

  test(`${name}: maps the package's jest/ folder`, () => {
    assert.equal(create().moduleNameMapper["^jest/(.*)$"], "<rootDir>/jest/$1");
  });

  test(`${name}: moduleNameMapper and setupFilesAfterEnv overrides replace the preset's`, () => {
    const config = create({
      moduleNameMapper: { "^extra$": "/extra.js" },
      setupFilesAfterEnv: ["/setup.js"],
    });
    assert.deepEqual(config.moduleNameMapper, { "^extra$": "/extra.js" });
    assert.deepEqual(config.setupFilesAfterEnv, ["/setup.js"]);
  });

  test(`${name}: own entries first, then the spread preset's, in their order`, () => {
    const config = create({ moduleNameMapper: { "^extra$": "/extra.js", ...mapper } });
    assert.deepEqual(Object.keys(config.moduleNameMapper), ["^extra$", ...Object.keys(mapper)]);
  });

  test(`${name}: any other override key replaces the preset's`, () => {
    assert.deepEqual(create({ roots: ["<rootDir>/lib"] }).roots, ["<rootDir>/lib"]);
  });
}
