const { createFlowJestConfig, webModuleNameMapper } = require("@support/jest/features-flow");

module.exports = createFlowJestConfig({
  passWithNoTests: true,
  webOverrides: {
    moduleNameMapper: {
      ...webModuleNameMapper,
      "^@ledgerhq/lumen-ui-react(/.*)?$": "<rootDir>/jest/lumen-ui-react.cjs",
    },
  },
});
