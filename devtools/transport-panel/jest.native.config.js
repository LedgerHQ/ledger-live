module.exports = require("@support/jest-devtools-fixtures").createNativeJestConfig({
  testTimeout: 30_000,
  moduleNameMapper: {
    "^jest/mocks/transport$": "<rootDir>/jest/mocks/transport.ts",
    "^react-native-vision-camera$": "<rootDir>/jest/mocks/react-native-vision-camera.tsx",
  },
});
