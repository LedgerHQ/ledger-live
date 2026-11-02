const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  {
    roots: ["<rootDir>"],
    collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!tests/**/*.test.ts"],
  },
  { esm: true },
);
