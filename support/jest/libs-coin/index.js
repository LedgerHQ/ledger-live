const { createSharedJestConfig, withEsmDeps } = require("../shared");

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

const walletFrameworkSetup = "@ledgerhq/wallet-framework-test-setup";
const disableNetworkSetup = "@ledgerhq/disable-network-setup";
const quarantineRetries = "@ledgerhq/test-quarantine/jest-retries";

/**
 * @typedef {object} LibsCoinOptions
 * @property {boolean} [esm] applies `withEsmDeps` (default true)
 * @property {string[]} [extraEsmDeps] more pnpm store prefixes to keep transformed
 * @property {string} [projectRoot] lcov root; else derived from `overrides.rootDir`, else
 *   `../../../` (a package in libs/coin-modules/)
 * @property {boolean} [network] unit tests and projects: leaves out
 *   `@ledgerhq/disable-network-setup`, for suites that mock the network with msw, which cannot
 *   share a run with nock (default false)
 * @property {boolean} [walletFramework] leaves out `@ledgerhq/wallet-framework-test-setup` when
 *   false (default true)
 */

/**
 * The setup files of a unit run: wallet framework, no network, test quarantine retries.
 *
 * @param {LibsCoinOptions} options
 * @returns {string[]}
 */
function unitSetupFiles({ network = false, walletFramework = true }) {
  return [
    ...(walletFramework ? [walletFrameworkSetup] : []),
    ...(network ? [] : [disableNetworkSetup]),
    quarantineRetries,
  ];
}

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
    // The setup files below carry the retries where a run wants them.
    retries: false,
  });
}

/**
 * Unit config of a coin module: node, the coin setup files (wallet framework, no network, test
 * quarantine retries), integration suites left out, coverage of `src/**` minus the tests.
 *
 * `setupFilesAfterEnv`, `collectCoverageFrom` and `testPathIgnorePatterns` add to the preset's;
 * every other key replaces it. `network: true` leaves out the no-network setup.
 *
 *   module.exports = createLibsCoinJestConfig({ rootDir: __dirname });
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {LibsCoinOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createLibsCoinJestConfig(
  {
    collectCoverageFrom = [],
    setupFilesAfterEnv = [],
    testPathIgnorePatterns = [],
    ...overrides
  } = {},
  options = {},
) {
  return sharedConfig(
    {
      passWithNoTests: true,
      ...overrides,
      setupFilesAfterEnv: [...unitSetupFiles(options), ...setupFilesAfterEnv],
      collectCoverageFrom: [...unitCoverage, ...collectCoverageFrom],
      testPathIgnorePatterns: [...unitIgnorePatterns, ...testPathIgnorePatterns],
    },
    options,
  );
}

/**
 * One entry of the `projects` of a coin module's unit config: jest does not pass the top-level
 * options of a config down to its projects, so each project starts from the unit defaults here
 * (node, transform, ESM dependencies, test matching, setup files).
 *
 * `setupFilesAfterEnv` and `testPathIgnorePatterns` add to the preset's; every other key replaces
 * it. Takes the unit config's `esm`, `extraEsmDeps`, `network` and `walletFramework` options.
 *
 *   projects: [
 *     createLibsCoinJestProject({ displayName: "unit", testPathIgnorePatterns: ["\\.msw\\.test\\.ts"] }),
 *     createLibsCoinJestProject({ displayName: "msw", testMatch: ["**\/*.msw.test.ts"] }, { network: true }),
 *   ],
 *
 * @param {import('@jest/types').Config.InitialProjectOptions} [overrides]
 * @param {LibsCoinOptions} [options]
 * @returns {import('@jest/types').Config.InitialProjectOptions}
 */
function createLibsCoinJestProject(
  { setupFilesAfterEnv = [], testPathIgnorePatterns = [], ...overrides } = {},
  { esm = true, extraEsmDeps = [], ...options } = {},
) {
  const { testEnvironment, roots, testMatch, transform } = createSharedJestConfig();
  const project = {
    testEnvironment,
    roots,
    testMatch,
    transform,
    ...overrides,
    setupFilesAfterEnv: [...unitSetupFiles(options), ...setupFilesAfterEnv],
    testPathIgnorePatterns: [...unitIgnorePatterns, ...testPathIgnorePatterns],
  };
  return esm ? withEsmDeps(project, { extraDeps: extraEsmDeps }) : project;
}

/**
 * Integration config of a coin module: the `*.integ.test.ts` suites, which hit live networks,
 * with a 60 s timeout, the wallet framework setup only and the default reporter (no quarantine,
 * no sonar). `setupFilesAfterEnv` adds to the preset's; every other key of `overrides` replaces
 * it. `walletFramework: false` leaves out the wallet framework setup.
 *
 *   module.exports = createLibsCoinIntegJestConfig({ rootDir: __dirname });
 *
 * @param {import('@jest/types').Config.InitialOptions} [overrides]
 * @param {LibsCoinOptions} [options]
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createLibsCoinIntegJestConfig(
  { setupFilesAfterEnv = [], ...overrides } = {},
  options = {},
) {
  const { walletFramework = true } = options;
  return sharedConfig(
    {
      testMatch: undefined,
      testRegex: ".integ.test.ts$",
      testTimeout: 60_000,
      forceExit: true,
      passWithNoTests: true,
      reporters: ["default"],
      ...overrides,
      setupFilesAfterEnv: [
        ...(walletFramework ? [walletFrameworkSetup] : []),
        ...setupFilesAfterEnv,
      ],
    },
    options,
  );
}

module.exports = {
  createLibsCoinJestConfig,
  createLibsCoinIntegJestConfig,
  createLibsCoinJestProject,
};
