const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

// ESM-only dependencies of @icp-sdk/core, which jest must transform to load from CommonJS. The
// preset already keeps @noble transformed.
const extraEsmDeps = ["@scure"];

module.exports = createLibsCoinJestConfig(
  {
    rootDir: __dirname,
    collectCoverageFrom: [
      // Vendored generated candid factories, excluded from coverage.
      "!src/network/idl/**",
    ],
  },
  { extraEsmDeps, network: true },
);
