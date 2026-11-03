const { createNativeJestConfig, nativeModuleNameMapper } = require("@support/jest/devtools");

module.exports = createNativeJestConfig({
  // First matching pattern wins, so the package's own entries come before the preset's.
  moduleNameMapper: {
    "^jest/mocks/transport$": "<rootDir>/jest/mocks/transport.ts",
    "^react-native-vision-camera$": "<rootDir>/jest/mocks/react-native-vision-camera.tsx",
    ...nativeModuleNameMapper,
  },
});
