// Pins the override rule of the devtools presets: every key replaces the preset's, and a package
// keeps the preset's mappers and setup files by spreading the exported tables.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  createNativeJestConfig,
  createWebJestConfig,
  nativeModuleNameMapper,
  nativeSetupFilesAfterEnv,
  webModuleNameMapper,
  webSetupFilesAfterEnv,
} = require("@support/jest/devtools");

const here = path.dirname(fileURLToPath(import.meta.url));

const factories = [
  [
    "createWebJestConfig",
    createWebJestConfig,
    webModuleNameMapper,
    webSetupFilesAfterEnv,
    ["^@ledgerhq/lumen-ui-react$", "<rootDir>/node_modules/@ledgerhq/lumen-ui-react"],
    path.join(here, "setup/web.js"),
  ],
  [
    "createNativeJestConfig",
    createNativeJestConfig,
    nativeModuleNameMapper,
    nativeSetupFilesAfterEnv,
    ["^expo-haptics$", path.join(here, "mocks/expo-haptics.ts")],
    path.join(here, "setup/native.ts"),
  ],
];

for (const [name, create, mapper, setupFiles, [mappedModule, mappedTo], setupFile] of factories) {
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

  test(`${name}: maps ${mappedModule} and runs its setup file`, () => {
    const config = create();
    assert.equal(config.moduleNameMapper[mappedModule], mappedTo);
    assert.ok(config.setupFilesAfterEnv.includes(setupFile), `no ${setupFile}`);
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
