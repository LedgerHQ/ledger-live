const { createLibJestConfig } = require("@support/jest/lib");

module.exports = createLibJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!tests/**/*.test.ts"],
});
