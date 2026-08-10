module.exports = require("@support/jest-devtools").createNativeJestConfig({
  moduleNameMapper: {
    "^jest/mocks/transport$": "<rootDir>/jest/mocks/transport.ts",
    "^react-native-vision-camera$": "<rootDir>/jest/mocks/react-native-vision-camera.tsx",
  },
});
