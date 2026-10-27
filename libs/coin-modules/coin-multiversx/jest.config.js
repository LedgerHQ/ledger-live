const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

// `network: true` leaves out @ledgerhq/disable-network-setup (nock), like coin-tezos, because
// nock@14 + msw/node conflict for axios-based clients (@ledgerhq/live-network).
// Network guard: unit tests mock the client; msw tests use onUnhandledRequest: "error".
module.exports = createLibsCoinJestConfig(
  {
    rootDir: __dirname,
    collectCoverageFrom: ["!src/__snapshots__/"],
  },
  { network: true },
);
