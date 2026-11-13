module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  // Like the @support/jest presets: the shared helpers in src/__tests__/ are not suites.
  testMatch: ["**/*.test.ts?(x)", "**/*.spec.ts?(x)"],
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          parser: { syntax: "typescript" },
        },
      },
    ],
  },
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
};
