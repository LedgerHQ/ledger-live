const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  moduleNameMapper: {
    "^@ledgerhq/wallet-btc/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: [],
});
