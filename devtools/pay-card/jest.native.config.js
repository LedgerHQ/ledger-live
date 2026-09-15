module.exports = require("@support/jest-devtools").createNativeJestConfig({
  moduleNameMapper: {
    // The clipboard is a native module; the library ships the mock for it.
    "^@react-native-clipboard/clipboard$":
      "<rootDir>/node_modules/@react-native-clipboard/clipboard/jest/clipboard-mock.js",
  },
});
