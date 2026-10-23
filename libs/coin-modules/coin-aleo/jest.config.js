const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  testPathIgnorePatterns: ["__tests__/"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
});
