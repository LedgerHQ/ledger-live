const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    passWithNoTests: true,
    collectCoverageFrom: [
      "src/**/*.ts",
      "!src/**/*.test.ts",
      "!src/**/*.spec.ts",
      "!src/test/**/*.ts",
      "!src/__tests__/**/*.ts",
      "!src/logic/tests/**/*.ts",
      "!src/datasets/**/*.ts",
      "!src/wallet-btc/__tests__/**/*.ts",
    ],
    moduleNameMapper: {
      "^@ledgerhq/coin-bitcoin/(.*)$": "<rootDir>/src/$1",
    },
    testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.ts"],
    modulePathIgnorePatterns: ["__tests__/fixtures"],
    setupFilesAfterEnv: [
      "@ledgerhq/wallet-framework-test-setup",
      "@ledgerhq/test-quarantine/jest-retries",
    ],
  },
  { esm: true },
);
