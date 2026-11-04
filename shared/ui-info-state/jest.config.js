const path = require("path");
const {
  createSharedUiJestConfig,
  nativeModuleNameMapper,
  webModuleNameMapper,
} = require("@support/jest/shared");

// Only Banner needs a package-specific stub (see jest/mocks); it replaces the preset's Lumen mock.
module.exports = createSharedUiJestConfig({
  webOverrides: {
    moduleNameMapper: {
      ...webModuleNameMapper,
      "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(__dirname, "jest/mocks/lumen-ui-react.js"),
    },
  },
  nativeOverrides: {
    moduleNameMapper: {
      ...nativeModuleNameMapper,
      "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "jest/mocks/lumen-ui-rnative.js"),
      "^@shared/ui-queued-bottom-sheet$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
    },
  },
});
