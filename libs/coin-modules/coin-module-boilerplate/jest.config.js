const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  // `workerThreads: true` is required for validating object with `bigint` values
  workerThreads: true,
});
