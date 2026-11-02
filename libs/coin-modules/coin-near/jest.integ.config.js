const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

// near-api-js v7 depends on ESM-only @noble/@scure packages, which have to be transpiled for Jest.
// The preset already keeps @noble transformed.
const extraEsmDeps = ["@scure"];

module.exports = createLibsCoinIntegJestConfig({ rootDir: __dirname }, { extraEsmDeps });
