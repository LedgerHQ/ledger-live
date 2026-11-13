const path = require("path");
const { createSharedUiNativeJestConfig, nativeModuleNameMapper } = require("@support/jest/shared");

// The preset stubs react-native without codegen; this local stub adds it.
module.exports = createSharedUiNativeJestConfig({
  moduleNameMapper: {
    ...nativeModuleNameMapper,
    "^react-native$": path.join(__dirname, "jest/mocks/react-native.js"),
  },
});
