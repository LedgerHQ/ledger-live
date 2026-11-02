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
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.[tj]s"],
};

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect), while
// `msw` runs the `.msw.test.ts` suites WITHOUT it — nock and MSW both build on @mswjs/interceptors, so
// they cannot share a run. Both keep wallet-framework-test-setup so getCryptoCurrencyById resolves.
module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testPathIgnorePatterns: [...sharedConfig.testPathIgnorePatterns, "\\.msw\\.test\\.ts"],
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
    },
  ],
});
