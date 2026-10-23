const { createSharedJestConfig } = require("@support/jest/shared");

// React package: jsdom + tsx tests, unlike the node/`*.test.ts` default.
module.exports = createSharedJestConfig({
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
});
