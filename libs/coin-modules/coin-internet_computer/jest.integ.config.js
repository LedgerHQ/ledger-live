const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

// ESM-only dependencies of @icp-sdk/core, which jest must transform to load from CommonJS. The
// preset already keeps @noble transformed.
const extraEsmDeps = ["@scure"];

module.exports = createLibsCoinIntegJestConfig({ rootDir: __dirname }, { extraEsmDeps });
