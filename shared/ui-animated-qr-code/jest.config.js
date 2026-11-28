const path = require("path");
const { createSharedUiJestConfig, nativeModuleNameMapper } = require("@support/jest/shared");

// The native preset stubs react-native but not reanimated; these local stubs fill the gap.
module.exports = createSharedUiJestConfig({
  coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/jest/"],
  nativeOverrides: {
    moduleNameMapper: {
      ...nativeModuleNameMapper,
      "^react-native$": path.join(__dirname, "jest/mocks/react-native.js"),
      "^react-native-reanimated$": path.join(__dirname, "jest/mocks/react-native-reanimated.ts"),
    },
  },
});
