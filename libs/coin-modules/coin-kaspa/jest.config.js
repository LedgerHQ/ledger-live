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
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integ.test.ts"],
};

// Two projects: `unit` runs with @ledgerhq/disable-network-setup (nock blocks all net connect),
// while `msw` runs the `.msw.test.ts` suites WITHOUT it — nock and MSW both build on
// @mswjs/interceptors, so they cannot share the same run. Mirrors coin-mina.
module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  coveragePathIgnorePatterns: ["src/test", "src/types", "src/index.ts"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  coveragePathIgnorePatterns: ["src/test", "src/types", "src/index.ts"],
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup", "@ledgerhq/disable-network-setup"],
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testPathIgnorePatterns: [...sharedConfig.testPathIgnorePatterns, ".msw.test.ts"],
      setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
    },
    {
      ...sharedConfig,
      displayName: "msw",
      testMatch: ["**/*.msw.test.ts"],
      setupFiles: ["./src/test/msw-setup.ts"],
    },
  ],
};
