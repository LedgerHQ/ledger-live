/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "casper-lcov.info", projectRoot: "../" }], "text"],
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "casper-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
