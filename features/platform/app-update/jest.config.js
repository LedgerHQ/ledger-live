const { createLibJestConfig } = require("@support/jest/lib");

module.exports = createLibJestConfig({
  rootDir: __dirname,
  passWithNoTests: true,
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
});
