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
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts", "\\.integ\\.test\\.ts$"],
};

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect),
// while `msw` runs the suites that exercise the real HTTP path via MSW WITHOUT it — nock and MSW
// both build on @mswjs/interceptors, so they cannot share the same run. Mirrors coin-kaspa/coin-mina.
module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.integ.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  coverageDirectory: "coverage",
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testMatch: ["**/*.unit.test.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/disable-network-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    },
    {
      ...sharedConfig,
      displayName: "msw",
      testMatch: ["**/*.test.ts"],
      testPathIgnorePatterns: [...sharedConfig.testPathIgnorePatterns, "\\.unit\\.test\\.ts$"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    },
  ],
};
