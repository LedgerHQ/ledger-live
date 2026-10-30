const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/", ".*\\.integration\\.test\\.ts"],
  },
  { esm: true },
);
