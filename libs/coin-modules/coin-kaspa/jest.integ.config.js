const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  // Live provider calls retry 429/5xx with up to ~15 s of backoff each (network/retryPolicy.ts),
  // so a test making several of them needs room beyond one retry cycle.
  testTimeout: 120_000,
});
