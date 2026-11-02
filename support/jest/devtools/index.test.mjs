// Pins the override rule of the devtools presets: every key replaces the preset's, and a package
// keeps the preset's mappers and setup files by spreading the exported tables.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const devtools = require("./index.js");

const factories = [
  ["createWebJestConfig", "webModuleNameMapper", "webSetupFilesAfterEnv"],
  ["createNativeJestConfig", "nativeModuleNameMapper", "nativeSetupFilesAfterEnv"],
];

for (const [name, mapper, setupFiles] of factories) {
  const create = devtools[name];

  test(`${name}: the exported mapper and setup files, as unfrozen copies`, () => {
    const { moduleNameMapper, setupFilesAfterEnv } = create();
    assert.deepEqual(moduleNameMapper, devtools[mapper]);
    assert.deepEqual(setupFilesAfterEnv, devtools[setupFiles]);
    assert.ok(Object.isFrozen(devtools[mapper]) && Object.isFrozen(devtools[setupFiles]));
    assert.ok(!Object.isFrozen(moduleNameMapper) && !Object.isFrozen(setupFilesAfterEnv));
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
    const config = create({ moduleNameMapper: { "^extra$": "/extra.js", ...devtools[mapper] } });
    assert.deepEqual(Object.keys(config.moduleNameMapper), [
      "^extra$",
      ...Object.keys(devtools[mapper]),
    ]);
  });

  test(`${name}: any other override key replaces the preset's`, () => {
    assert.deepEqual(create({ roots: ["<rootDir>/lib"] }).roots, ["<rootDir>/lib"]);
  });
}
