const { createLibsCoinJestConfig, libsCoinDefaults } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom, "!src/index.ts"],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "jest-expect-message",
    "dotenv/config",
    // "@ledgerhq/disable-network-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
});
