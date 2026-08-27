const { createSharedJestConfig, sharedReporters } = require("@support/jest-shared");
module.exports = createSharedJestConfig({
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : []), ...sharedReporters],
});
