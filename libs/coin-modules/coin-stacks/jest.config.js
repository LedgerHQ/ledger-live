/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "text"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "stacks-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
