const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    testMatch: undefined,
    testRegex: ".integ.test.ts$",
    testPathIgnorePatterns: ["lib/", "lib-es/"],
    testTimeout: 60_000,
    // The integration suites share the public explorer: run them serially to avoid rate limits.
    maxWorkers: 1,
    forceExit: true,
    passWithNoTests: true,
    setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
    reporters: ["default"],
  },
  { esm: true },
);
