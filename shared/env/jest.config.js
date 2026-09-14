const { createSharedJestConfig } = require("@support/jest-shared");
module.exports = createSharedJestConfig({
  modulePaths: ["<rootDir>/node_modules"],
});
