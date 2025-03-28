/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "icp-lcov.info", projectRoot: "../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "icp-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
