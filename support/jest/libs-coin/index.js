const { createSharedJestConfig } = require("../shared");

// Integration suites hit live networks; the unit config leaves them to the integration config.
const integrationTests = ".*\\.(integ|integration)\\.test\\.[tj]s";

const unitIgnorePatterns = ["lib/", "lib-es/", "node_modules/", integrationTests];

const unitCoverage = [
  "src/**/*.ts",
  "!src/**/*.test.ts",
  "!src/**/*.spec.ts",
  "!src/test/**/*.ts",
  "!src/__tests__/**/*.ts",
];

const unitSetupFiles = [
  "@ledgerhq/wallet-framework-test-setup",
  "@ledgerhq/disable-network-setup",
  "@ledgerhq/test-quarantine/jest-retries",
];

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
 * `collectCoverageFrom` and `testPathIgnorePatterns` add to the preset's; every other key
 * replaces it, `setupFilesAfterEnv` included (a module that reaches the network in unit tests
 * passes its own list).
 *
 *   module.exports = createLibsCoinJestConfig({ rootDir: __dirname });
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {LibsCoinOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createLibsCoinJestConfig(
  { collectCoverageFrom = [], testPathIgnorePatterns = [], ...overrides } = {},
  options,
) {
  return sharedConfig(
    {
      passWithNoTests: true,
      setupFilesAfterEnv: unitSetupFiles,
      ...overrides,
      collectCoverageFrom: [...unitCoverage, ...collectCoverageFrom],
      testPathIgnorePatterns: [...unitIgnorePatterns, ...testPathIgnorePatterns],
    },
    options,
  );
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

module.exports = { createLibsCoinJestConfig, createLibsCoinIntegJestConfig };
