const { createLibJestConfig } = require("@support/jest/lib");

module.exports = createLibJestConfig(
  {
    rootDir: __dirname,
    testEnvironmentOptions: {
      customExportConditions: ["@ledgerhq/source"],
    },
  },
  { extraEsmDeps: ["@ledgerhq\\+"] },
);
