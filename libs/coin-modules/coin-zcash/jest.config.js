const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    passWithNoTests: true,
    setupFilesAfterEnv: [
      "@ledgerhq/wallet-framework-test-setup",
      "@ledgerhq/disable-network-setup",
      "@ledgerhq/test-quarantine/jest-retries",
    ],
    collectCoverageFrom: [
      "src/**/*.ts",
      "!src/**/*.test.ts",
      "!src/**/*.spec.ts",
      "!src/test/**/*.ts",
      "!src/__tests__/**/*.ts",
      // Type declarations and re-export barrels compile to nothing executable, so
      // istanbul cannot build a coverage object for them and drops them from the
      // report with an error. Left in, they only add noise.
      "!src/types/assets.ts",
      "!src/types/bridge.ts",
      "!src/types/signer.ts",
      "!src/types/index.ts",
      "!src/network/types.ts",
      "!src/index.ts",
      "!src/signer/index.ts",
    ],
    testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
    modulePathIgnorePatterns: ["__tests__/fixtures"],
    // `workerThreads: true` is required for validating object with `bigint` values
    workerThreads: true,
  },
  { esm: true },
);
