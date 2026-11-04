const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig(
  { rootDir: __dirname, passWithNoTests: true },
  { esm: true },
);
