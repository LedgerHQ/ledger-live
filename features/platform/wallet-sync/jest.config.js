const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    passWithNoTests: true,
    testMatch: ["**/*.test.ts?(x)"],
    setupFiles: ["<rootDir>/jest.setup.js"],
  },
  { esm: true },
);
