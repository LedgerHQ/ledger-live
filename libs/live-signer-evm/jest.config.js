const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    roots: ["<rootDir>"],
    testEnvironmentOptions: {
      customExportConditions: ["@ledgerhq/source"],
    },
  },
  { esm: true, extraEsmDeps: ["@ledgerhq\\+"] },
);
