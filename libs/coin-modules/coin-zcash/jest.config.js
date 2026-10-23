const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: [
    // Type declarations and re-export barrels compile to nothing executable, so
    // istanbul cannot build a coverage object for them and drops them from the
    // report with an error. Left in, they only add noise.
    "!src/types/assets.ts",
    "!src/types/bridge.ts",
    "!src/types/signer.ts",
    "!src/types/index.ts",
    "!src/network/types.ts",
    "!src/index.ts",
    "!src/signer/index.ts",
  ],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  // `workerThreads: true` is required for validating object with `bigint` values
  workerThreads: true,
});
