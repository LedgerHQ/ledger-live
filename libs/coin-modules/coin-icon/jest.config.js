/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  passWithNoTests: true,
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  modulePathIgnorePatterns: [
    "/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "icon-lcov.info", projectRoot: "../" }], "text"],
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "icon-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
