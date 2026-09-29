module.exports = {
  testEnvironment: "node",
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source"],
  },
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  // @ledgerhq packages (e.g. live-dmk-shared) resolve to their TS source via the
  // condition above, so swc must transform them even inside node_modules;
  // everything else there stays ignored.
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup", "@ledgerhq/test-quarantine/jest-retries"],
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
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!tests/**/*.test.ts"],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
};
