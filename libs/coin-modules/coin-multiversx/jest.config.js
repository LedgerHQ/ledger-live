/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
    "!src/__snapshots__/",
  ],
  coverageReporters: [
    "json",
    ["lcov", { file: "multiversx-lcov.info", projectRoot: "../" }],
    "text",
  ],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "multiversx-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
