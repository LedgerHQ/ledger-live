const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  /** Long integ tests (onboarding + party polling) need headroom; avoids racing the poll helper. */
  testTimeout: 120_000,
  /** Serial runs reduce shared devnet contention across multiple *.integ.test.ts files. */
  maxWorkers: 1,
});
