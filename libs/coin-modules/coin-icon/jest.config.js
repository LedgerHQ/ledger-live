const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  modulePathIgnorePatterns: [
    "/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
});
