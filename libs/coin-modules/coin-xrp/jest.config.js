/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
// `workerThreads: true` is required for validating object with `bigint` values
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  passWithNoTests: true,
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.[tj]s"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "xrp-lcov.info", projectRoot: "../" }], "text"],
  workerThreads: true,
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "xrp-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
