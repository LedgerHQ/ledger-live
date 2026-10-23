const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    passWithNoTests: true,
    collectCoverageFrom: [
      "src/**/*.ts",
      "!src/**/*.test.ts",
      "!src/**/*.spec.ts",
      "!src/__tests__/**/*.ts",
    ],
    moduleNameMapper: {
      "^@ledgerhq/wallet-btc/(.*)$": "<rootDir>/src/$1",
    },
    testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.ts"],
    modulePathIgnorePatterns: ["__tests__/fixtures"],
    setupFilesAfterEnv: [
      "@ledgerhq/wallet-framework-test-setup",
      "@ledgerhq/disable-network-setup",
      "@ledgerhq/test-quarantine/jest-retries",
    ],
  },
  { esm: true },
);
