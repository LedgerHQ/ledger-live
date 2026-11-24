const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
  // setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
});
