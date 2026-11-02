module.exports = require("@support/jest/devtools").createNativeJestConfig({
  // The lazy contract must also hold when the package resolves to its react-native entry.
  testMatch: ["**/*.native.test.{ts,tsx}", "**/lazyContract.test.ts"],
});
