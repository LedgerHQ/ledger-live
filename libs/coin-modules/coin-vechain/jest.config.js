/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/datasets/**/*.ts",
    "!src/__snapshots__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "vechain-lcov.info", projectRoot: "../" }], "text"],
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "vechain-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
