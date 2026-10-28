const { createSharedJestConfig } = require("@support/jest/shared");

// Exception listed in support/jest/core/preset-overrides.js.
module.exports = createSharedJestConfig({
  rootDir: __dirname,
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.ts?(x)"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          parser: { syntax: "typescript", tsx: true },
          transform: { react: { runtime: "automatic" } },
        },
      },
    ],
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom", "@ledgerhq/test-quarantine/jest-retries"],
  // Pinned so a source file with no test counts as 0% instead of vanishing from the report.
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/__tests__/**"],
});
