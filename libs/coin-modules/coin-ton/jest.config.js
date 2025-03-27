/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "ton-lcov.info", projectRoot: "../" }], "text"],
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  modulePathIgnorePatterns: [
    "__tests__/fixtures",
    "__tests__/integration/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
  reporters: [
    [
      "jest-sonar",
      { outputName: "ton-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
