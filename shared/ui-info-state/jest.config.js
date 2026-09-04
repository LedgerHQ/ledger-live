const path = require("path");
const { createSharedUiJestConfig } = require("@support/jest-shared");

// Only Banner needs a package-specific stub (see jest/mocks). Supplying moduleNameMapper in a
// project override replaces that project's defaults, so the shared mocks this package actually
// relies on are re-declared here from @support/jest-shared rather than copied.
module.exports = createSharedUiJestConfig({
  webOverrides: {
    moduleNameMapper: {
      "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(__dirname, "jest/mocks/lumen-ui-react.js"),
    },
  },
  nativeOverrides: {
    moduleNameMapper: {
      "^react-native$": require.resolve("@support/jest-shared/mocks/react-native"),
      "^react-native-safe-area-context$":
        require.resolve("@support/jest-shared/mocks/safe-area-context"),
      "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "jest/mocks/lumen-ui-rnative.js"),
    },
  },
});
