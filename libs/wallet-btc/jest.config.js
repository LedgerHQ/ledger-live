const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  moduleNameMapper: {
    "^@ledgerhq/wallet-btc/(.*)$": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: ["__tests__/fixtures"],
});
