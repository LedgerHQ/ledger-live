/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "algorand-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
