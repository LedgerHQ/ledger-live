const { createSharedJestConfig } = require("@support/jest-shared");
module.exports = createSharedJestConfig({
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  globals: {
    IS_REACT_ACT_ENVIRONMENT: true,
  },
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
});
