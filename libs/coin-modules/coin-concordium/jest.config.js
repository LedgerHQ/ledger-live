const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  setupFiles: ["<rootDir>/jest.setup.js"],
  // `workerThreads: true` is required for validating object with `bigint` values
  workerThreads: true,
});
