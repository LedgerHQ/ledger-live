const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  // src/__tests__/bridge/serialization.ts is a suite without the `.test.ts` suffix.
  testMatch: ["**/*.test.ts", "**/__tests__/**/*.ts"],
  coveragePathIgnorePatterns: [
    "src/test",
    "src/types",
    "src/index.ts",
    "src/bridge/bridge.fixture.ts",
  ],
});
