module.exports = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    "@ledgerhq/test-quarantine/jest",
  ],
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
};
