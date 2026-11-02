const {
  createLibsCoinJestConfig,
  createLibsCoinJestProject,
  libsCoinDefaults,
} = require("@support/jest/libs-coin");

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect),
// while `msw` runs the `.msw.test.ts` suites WITHOUT it — nock and MSW both build on
// @mswjs/interceptors, so they cannot share the same run. Mirrors coin-kaspa.
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  // MSW suites make mocked network calls that are fast locally but can be starved past jest's 5s
  // default under CI parallelism; give them headroom so the run stays deterministic.
  testTimeout: 30_000,
  collectCoverageFrom: [
    ...libsCoinDefaults.collectCoverageFrom,
    "!src/datasets/**/*.ts",
    "!src/__snapshots__/**/*.ts",
  ],
  coveragePathIgnorePatterns: ["src/test", "src/types", "src/index.ts"],
  projects: [
    createLibsCoinJestProject({
      displayName: "unit",
      testPathIgnorePatterns: [...libsCoinDefaults.testPathIgnorePatterns, "\\.msw\\.test\\.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/disable-network-setup",
        "./src/test/coinConfig.setup.ts",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    }),
    createLibsCoinJestProject({
      displayName: "msw",
      testMatch: ["**/*.msw.test.ts"],
      setupFiles: ["@ledgerhq/wallet-framework-test-setup", "./src/test/coinConfig.setup.ts"],
      setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
    }),
  ],
});
