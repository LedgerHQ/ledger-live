const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    testMatch: undefined,
    testRegex: ".integ.test.ts$",
    testPathIgnorePatterns: ["lib/", "lib-es/"],
    testTimeout: 60_000,
    forceExit: true,
    setupFilesAfterEnv: [],
    reporters: ["default"],
  },
  { esm: true },
);
