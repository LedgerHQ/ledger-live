const { createLibsCoinJestConfig, libsCoinDefaults } = require("@support/jest/libs-coin");

// ESM-only dependencies of @icp-sdk/core, which jest must transform to load from CommonJS. The
// preset already keeps @noble transformed.
const extraEsmDeps = ["@scure"];

module.exports = createLibsCoinJestConfig(
  {
    rootDir: __dirname,
    collectCoverageFrom: [
      ...libsCoinDefaults.collectCoverageFrom,
      // Vendored generated candid factories, excluded from coverage.
      "!src/network/idl/**",
    ],
    setupFilesAfterEnv: [
      "@ledgerhq/wallet-framework-test-setup",
      "@ledgerhq/test-quarantine/jest-retries",
    ],
  },
  { extraEsmDeps },
);
