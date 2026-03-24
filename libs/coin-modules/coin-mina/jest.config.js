const sharedConfig = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
  // `workerThreads: true` is required for validating objects with `bigint` values
  workerThreads: true,
};

module.exports = {
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testPathIgnorePatterns: [...sharedConfig.testPathIgnorePatterns, ".*\\.msw\\.test\\.[tj]s"],
      setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
    },
    {
      ...sharedConfig,
      displayName: "msw",
      testMatch: ["**/*.msw.test.ts"],
      setupFiles: ["./src/test/helpers/msw-setup.ts"],
    },
  ],
};
