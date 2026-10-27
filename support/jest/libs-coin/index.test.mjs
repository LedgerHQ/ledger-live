// Pins how the node presets treat setup files: a package's list adds to the preset's, and only a
// named option removes one of the preset's. Also pins the project builder against the unit config.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { createSharedJestConfig } = require("../shared");
const {
  createLibsCoinJestConfig,
  createLibsCoinIntegJestConfig,
  createLibsCoinJestProject,
} = require(".");

const walletFramework = "@ledgerhq/wallet-framework-test-setup";
const noNetwork = "@ledgerhq/disable-network-setup";
const retries = "@ledgerhq/test-quarantine/jest-retries";

test("createSharedJestConfig: setup files add to the retries, `retries: false` drops them", () => {
  assert.deepEqual(createSharedJestConfig().setupFilesAfterEnv, [retries]);
  assert.deepEqual(createSharedJestConfig({ setupFilesAfterEnv: ["./a.ts"] }).setupFilesAfterEnv, [
    retries,
    "./a.ts",
  ]);
  assert.deepEqual(createSharedJestConfig({}, { retries: false }).setupFilesAfterEnv, []);
});

test("createLibsCoinJestConfig: setup files add to the coin ones, options drop one", () => {
  assert.deepEqual(createLibsCoinJestConfig().setupFilesAfterEnv, [
    walletFramework,
    noNetwork,
    retries,
  ]);
  assert.deepEqual(
    createLibsCoinJestConfig({ setupFilesAfterEnv: ["./a.ts"] }, { network: true })
      .setupFilesAfterEnv,
    [walletFramework, retries, "./a.ts"],
  );
  assert.deepEqual(createLibsCoinJestConfig({}, { walletFramework: false }).setupFilesAfterEnv, [
    noNetwork,
    retries,
  ]);
});

test("createLibsCoinIntegJestConfig: no retries, `walletFramework: false` drops its setup", () => {
  assert.deepEqual(createLibsCoinIntegJestConfig().setupFilesAfterEnv, [walletFramework]);
  assert.deepEqual(
    createLibsCoinIntegJestConfig({ setupFilesAfterEnv: ["./a.ts"] }).setupFilesAfterEnv,
    [walletFramework, "./a.ts"],
  );
  assert.deepEqual(
    createLibsCoinIntegJestConfig({}, { walletFramework: false }).setupFilesAfterEnv,
    [],
  );
});

test("createLibsCoinJestProject: the unit config's project options, overrides by the same rule", () => {
  const unit = createLibsCoinJestConfig();
  const project = createLibsCoinJestProject();
  for (const key of [
    "testEnvironment",
    "roots",
    "testMatch",
    "transform",
    "transformIgnorePatterns",
    "testPathIgnorePatterns",
    "setupFilesAfterEnv",
  ]) {
    assert.deepEqual(project[key], unit[key], key);
  }
  // Top-level options jest does not read from a project.
  for (const key of ["reporters", "coverageReporters", "collectCoverageFrom", "passWithNoTests"]) {
    assert.equal(key in project, false, key);
  }

  const msw = createLibsCoinJestProject(
    { displayName: "msw", testPathIgnorePatterns: ["\\.unit\\.test\\.ts$"] },
    { network: true, extraEsmDeps: ["@scure"] },
  );
  assert.equal(msw.displayName, "msw");
  assert.deepEqual(msw.testPathIgnorePatterns, [
    ...unit.testPathIgnorePatterns,
    "\\.unit\\.test\\.ts$",
  ]);
  assert.deepEqual(msw.setupFilesAfterEnv, [walletFramework, retries]);
  assert.match(msw.transformIgnorePatterns[0], /@scure/);
  assert.equal("transformIgnorePatterns" in createLibsCoinJestProject({}, { esm: false }), false);
});
