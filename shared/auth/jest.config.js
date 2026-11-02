const { createSharedJestConfig } = require("@support/jest/shared");
module.exports = createSharedJestConfig({
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
});
