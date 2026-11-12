const {
  createLibsCoinJestConfig,
  createLibsCoinJestProject,
  libsCoinDefaults,
} = require("@support/jest/libs-coin");

// `msw` runs the `.msw.test.ts` suites without @ledgerhq/disable-network-setup: nock and MSW both
// build on @mswjs/interceptors, so they cannot share a run. Mirrors coin-cosmos.
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  coveragePathIgnorePatterns: ["/types/"],
  // `workerThreads: true` is required for validating object with `bigint` values
  workerThreads: true,
  projects: [
    createLibsCoinJestProject({
      displayName: "unit",
      testPathIgnorePatterns: [...libsCoinDefaults.testPathIgnorePatterns, "\\.msw\\.test\\.ts"],
    }),
    createLibsCoinJestProject({
      displayName: "msw",
      testMatch: ["**/*.msw.test.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    }),
  ],
});
