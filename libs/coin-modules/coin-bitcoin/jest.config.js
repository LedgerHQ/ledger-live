const { createLibsCoinJestConfig, libsCoinDefaults } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: [
    ...libsCoinDefaults.collectCoverageFrom,
    "!src/logic/tests/**/*.ts",
    "!src/datasets/**/*.ts",
    "!src/wallet-btc/__tests__/**/*.ts",
  ],
  moduleNameMapper: {
    "^@ledgerhq/coin-bitcoin/(.*)$": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
});
