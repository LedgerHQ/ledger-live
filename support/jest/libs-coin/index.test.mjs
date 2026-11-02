// Pins how the libs-coin presets treat overrides: every key replaces the preset's, as in jest, and
// a package extends a default list by spreading libsCoinDefaults. Also pins the project builder
// against the unit config.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  createLibsCoinJestConfig,
  createLibsCoinIntegJestConfig,
  createLibsCoinJestProject,
  libsCoinDefaults,
} = require(".");

test("createLibsCoinJestConfig: the defaults are the unit lists, an override replaces one", () => {
  const unit = createLibsCoinJestConfig();
  for (const key of ["collectCoverageFrom", "setupFilesAfterEnv", "testPathIgnorePatterns"]) {
    assert.deepEqual(unit[key], libsCoinDefaults[key], key);
    assert.deepEqual(createLibsCoinJestConfig({ [key]: ["x"] })[key], ["x"], key);
  }
  assert.deepEqual(
    createLibsCoinJestConfig({
      collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom, "!src/fixtures/**"],
    }).collectCoverageFrom,
    [...libsCoinDefaults.collectCoverageFrom, "!src/fixtures/**"],
  );
  assert.ok(Object.isFrozen(libsCoinDefaults.setupFilesAfterEnv));
  assert.notEqual(unit.setupFilesAfterEnv, libsCoinDefaults.setupFilesAfterEnv);
});

test("createLibsCoinIntegJestConfig: the wallet framework setup only, replaced by an override", () => {
  assert.deepEqual(createLibsCoinIntegJestConfig().setupFilesAfterEnv, [
    "@ledgerhq/wallet-framework-test-setup",
  ]);
  assert.deepEqual(
    createLibsCoinIntegJestConfig({ setupFilesAfterEnv: [] }).setupFilesAfterEnv,
    [],
  );
});

test("createLibsCoinJestProject: the unit config's project options, every override replaces", () => {
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
    { displayName: "msw", setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"] },
    { extraEsmDeps: ["@scure"] },
  );
  assert.equal(msw.displayName, "msw");
  assert.deepEqual(msw.setupFilesAfterEnv, ["@ledgerhq/test-quarantine/jest-retries"]);
  assert.match(msw.transformIgnorePatterns[0], /@scure/);
  assert.equal("transformIgnorePatterns" in createLibsCoinJestProject({}, { esm: false }), false);
});

test("the node presets' reporter tables cannot change, and each config gets its own copies", () => {
  const { createSharedJestConfig, jestSonarReporter, sharedReporters } = require("../shared");
  const tail = structuredClone(sharedReporters);
  assert.throws(() => sharedReporters.splice(0), TypeError);
  assert.throws(() => sharedReporters.push("extra"), TypeError);
  assert.throws(() => {
    jestSonarReporter[0] = "other";
  }, TypeError);
  assert.throws(() => {
    jestSonarReporter[1].outputName = "other.xml";
  }, TypeError);
  assert.deepEqual(sharedReporters, tail);

  // Jest writes the resolved module path into each reporter tuple it normalizes.
  for (const config of [createSharedJestConfig(), createLibsCoinJestConfig()]) {
    assert.deepEqual(config.reporters.slice(-2), tail);
    const sonar = config.reporters.at(-2);
    assert.notEqual(sonar, jestSonarReporter);
    assert.ok(!Object.isFrozen(sonar) && !Object.isFrozen(sonar[1]));
  }
});
