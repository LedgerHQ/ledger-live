const {
  createLibsCoinJestConfig,
  createLibsCoinJestProject,
  libsCoinDefaults,
} = require("@support/jest/libs-coin");

// near-api-js v7 depends on ESM-only @noble/@scure packages, which have to be transpiled for Jest.
// The preset already keeps @noble transformed.
const extraEsmDeps = ["@scure"];

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect),
// while `msw` runs the suites that exercise the real HTTP path via MSW WITHOUT it — nock and MSW
// both build on @mswjs/interceptors, so they cannot share the same run. Mirrors coin-kaspa/coin-mina.
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  projects: [
    createLibsCoinJestProject(
      { displayName: "unit", testMatch: ["**/*.unit.test.ts"] },
      { extraEsmDeps },
    ),
    createLibsCoinJestProject(
      {
        displayName: "msw",
        testPathIgnorePatterns: [
          ...libsCoinDefaults.testPathIgnorePatterns,
          "\\.unit\\.test\\.ts$",
        ],
        setupFilesAfterEnv: [
          "@ledgerhq/wallet-framework-test-setup",
          "@ledgerhq/test-quarantine/jest-retries",
        ],
      },
      { extraEsmDeps },
    ),
  ],
});
