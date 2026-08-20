module.exports = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/", "lib-es/", "__tests__/test-utils"],
  coveragePathIgnorePatterns: ["__tests__/test-utils"],
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          transform: {
            react: {
              runtime: "automatic",
            },
          },
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
