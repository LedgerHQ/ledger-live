const {
  createLibsCoinJestConfig,
  createLibsCoinJestProject,
  libsCoinDefaults,
} = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom, "!src/test/**", "!src/index.ts"],
  projects: [
    createLibsCoinJestProject({
      displayName: "unit",
      testPathIgnorePatterns: [
        ...libsCoinDefaults.testPathIgnorePatterns,
        ".*\\.msw\\.test\\.[tj]s",
      ],
      // `workerThreads: true` is required for validating objects with `bigint` values
      workerThreads: true,
    }),
    createLibsCoinJestProject({
      displayName: "msw",
      testMatch: ["**/*.msw.test.ts"],
      setupFiles: ["./src/test/helpers/msw-setup.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
      workerThreads: true,
    }),
  ],
});
