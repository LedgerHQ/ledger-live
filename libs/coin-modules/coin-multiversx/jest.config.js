const { createLibsCoinJestConfig, libsCoinDefaults } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: [...libsCoinDefaults.collectCoverageFrom, "!src/__snapshots__/"],
  // @ledgerhq/disable-network-setup (nock) is intentionally not enabled, like coin-tezos,
  // because nock@14 + msw/node conflict for axios-based clients (@ledgerhq/live-network).
  // Network guard: unit tests mock the client; msw tests use onUnhandledRequest: "error".
  // setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
});
