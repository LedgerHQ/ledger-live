const path = require("path");
const { createSharedUiJestConfig } = require("@support/jest/shared");

// Only Banner needs a package-specific stub (see jest/mocks); the overrides add to the preset's
// mocks.
module.exports = createSharedUiJestConfig({
  webOverrides: {
    moduleNameMapper: {
      "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(__dirname, "jest/mocks/lumen-ui-react.js"),
    },
  },
  nativeOverrides: {
    moduleNameMapper: {
      "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "jest/mocks/lumen-ui-rnative.js"),
      "^@shared/ui-queued-bottom-sheet$": "@shared/ui-queued-bottom-sheet/testing/module-mock",
    },
  },
});
