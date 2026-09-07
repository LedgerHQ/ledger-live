module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
  transform: {
    "^.+\\.(ts|tsx)?$": [
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
};
