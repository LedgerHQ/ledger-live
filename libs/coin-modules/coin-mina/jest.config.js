const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

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

module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  collectCoverageFrom: ["!src/test/**", "!src/index.ts"],
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testPathIgnorePatterns: [...sharedConfig.testPathIgnorePatterns, ".*\\.msw\\.test\\.[tj]s"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/disable-network-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    },
    {
      ...sharedConfig,
      displayName: "msw",
      testMatch: ["**/*.msw.test.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
      setupFiles: ["./src/test/helpers/msw-setup.ts"],
    },
  ],
});
