/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  modulePathIgnorePatterns: [
    "/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "text"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "icon-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
