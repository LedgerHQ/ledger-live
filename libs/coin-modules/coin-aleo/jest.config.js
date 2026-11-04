const { createLibsCoinJestConfig, libsCoinDefaults } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  testPathIgnorePatterns: [...libsCoinDefaults.testPathIgnorePatterns, "__tests__/"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
});
