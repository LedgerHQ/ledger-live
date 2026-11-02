module.exports = require("@support/jest/features-flow").createFlowJestConfig({
  passWithNoTests: true,
  webOverrides: {
    moduleNameMapper: {
      "^@ledgerhq/lumen-ui-react(/.*)?$": "<rootDir>/jest/lumen-ui-react.cjs",
    },
  },
});
