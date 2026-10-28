const { createSharedJestConfig, withEsmDeps } = require("../shared");

// Integration suites hit live networks; the unit config leaves them to the integration config.
const integrationTests = ".*\\.(integ|integration)\\.test\\.[tj]s";

/**
 * The lists the unit config sets. Every override replaces the preset's value, as in jest, so a
 * package that extends one of them spreads it:
 *
 *   collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom, "!src/datasets/**"],
 */
const libsCoinDefaults = Object.freeze({
  collectCoverageFrom: Object.freeze([
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
  ]),
  setupFilesAfterEnv: Object.freeze([
    "@ledgerhq/wallet-framework-test-setup",
    "@ledgerhq/disable-network-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ]),
  testPathIgnorePatterns: Object.freeze(["lib/", "lib-es/", "node_modules/", integrationTests]),
});

/**
 * @typedef {object} LibsCoinOptions
 * @property {boolean} [esm] applies `withEsmDeps` (default true)
 * @property {string[]} [extraEsmDeps] more pnpm store prefixes to keep transformed
 * @property {string} [projectRoot] lcov root; else derived from `overrides.rootDir`, else
 *   `../../../` (a package in libs/coin-modules/)
 */

/**
 * @param {import('@jest/types').Config.InitialOptions} config
 * @param {LibsCoinOptions} options
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function sharedConfig(config, { esm = true, extraEsmDeps, projectRoot } = {}) {
  return createSharedJestConfig(config, {
    esm,
    extraEsmDeps,
    projectRoot: projectRoot ?? (config.rootDir === undefined ? "../../../" : undefined),
  });
}

/**
 * Unit config of a coin module: node, the coin setup files (wallet framework, no network, test
 * quarantine retries), integration suites left out, coverage of `src/**` minus the tests.
 *
 * Every key of `overrides` replaces the preset's; `libsCoinDefaults` holds the lists a package
 * extends by spreading them.
 *
 *   module.exports = createLibsCoinJestConfig({ rootDir: __dirname });
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {LibsCoinOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createLibsCoinJestConfig(overrides = {}, options) {
  return sharedConfig(
    {
      passWithNoTests: true,
      collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom],
      setupFilesAfterEnv: [...libsCoinDefaults.setupFilesAfterEnv],
      testPathIgnorePatterns: [...libsCoinDefaults.testPathIgnorePatterns],
      ...overrides,
    },
    options,
  );
}

/**
 * One entry of the `projects` of a coin module's unit config: jest does not pass the top-level
 * options of a config down to its projects, so each project starts from the unit defaults here
 * (node, transform, ESM dependencies, test matching, setup files, ignored paths). Every key of
 * `overrides` replaces the preset's.
 *
 *   projects: [
 *     createLibsCoinJestProject({ displayName: "unit", testPathIgnorePatterns: [...] }),
 *     createLibsCoinJestProject({ displayName: "msw", setupFilesAfterEnv: [...] }),
 *   ],
 *
 * @param {import('@jest/types').Config.InitialProjectOptions} [overrides]
 * @param {Pick<LibsCoinOptions, "esm" | "extraEsmDeps">} [options]
 * @returns {import('@jest/types').Config.InitialProjectOptions}
 */
function createLibsCoinJestProject(overrides = {}, { esm = true, extraEsmDeps = [] } = {}) {
  const { testEnvironment, roots, testMatch, transform } = createSharedJestConfig();
  const project = {
    testEnvironment,
    roots,
    testMatch,
    transform,
    setupFilesAfterEnv: [...libsCoinDefaults.setupFilesAfterEnv],
    testPathIgnorePatterns: [...libsCoinDefaults.testPathIgnorePatterns],
    ...overrides,
  };
  return esm ? withEsmDeps(project, { extraDeps: extraEsmDeps }) : project;
}

/**
 * Integration config of a coin module: the `*.integ.test.ts` suites, which hit live networks,
 * with a 60 s timeout, the wallet framework setup only and the default reporter (no quarantine,
 * no sonar). Every key of `overrides` replaces the preset's.
 *
 *   module.exports = createLibsCoinIntegJestConfig({ rootDir: __dirname });
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {LibsCoinOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createLibsCoinIntegJestConfig(overrides = {}, options) {
  return sharedConfig(
    {
      testMatch: undefined,
      testRegex: ".integ.test.ts$",
      testTimeout: 60_000,
      forceExit: true,
      passWithNoTests: true,
      setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
      reporters: ["default"],
      ...overrides,
    },
    options,
  );
}

module.exports = {
  createLibsCoinJestConfig,
  createLibsCoinIntegJestConfig,
  createLibsCoinJestProject,
  libsCoinDefaults,
};
