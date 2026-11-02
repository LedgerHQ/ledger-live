const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  // The integration suites share the public explorer: run them serially to avoid rate limits.
  maxWorkers: 1,
});
