/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
// `workerThreads: true` is required for validating object with `bigint` values
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: [
    "json",
    ["lcov", { file: "boilerplate-lcov.info", projectRoot: "../" }],
    "text",
  ],
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
  workerThreads: true,
  reporters: [
    "default",
    [
      "jest-sonar",
      {
        outputName: "boilerplate-sonar-executionTests-report.xml",
        reportedFilePath: "absolute",
      },
    ],
  ],
};
