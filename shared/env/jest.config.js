const { createSharedJestConfig } = require("@support/jest-shared");
module.exports = createSharedJestConfig({
  moduleNameMapper: {
    "^@ledgerhq/live-env$": "<rootDir>/../../libs/env/src/index.ts",
  },
  modulePaths: ["<rootDir>/node_modules"],
});
