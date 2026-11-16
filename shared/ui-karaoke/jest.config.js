const path = require("path");
const { createSharedUiNativeJestConfig, nativeModuleNameMapper } = require("@support/jest/shared");

// The preset stubs react-native but not reanimated or svg; these local stubs fill the gap.
module.exports = createSharedUiNativeJestConfig({
  moduleNameMapper: {
    ...nativeModuleNameMapper,
    "^react-native$": path.join(__dirname, "jest/mocks/react-native.js"),
    "^react-native-reanimated$": path.join(__dirname, "jest/mocks/react-native-reanimated.js"),
    "^react-native-svg$": path.join(__dirname, "jest/mocks/react-native-svg.js"),
  },
});
