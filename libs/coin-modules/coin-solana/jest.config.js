const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig(
  {
    rootDir: __dirname,
    modulePathIgnorePatterns: ["__tests__/fixtures"],
  },
  { extraEsmDeps: ["ky"] },
);
