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
  coverageReporters: ["json", ["lcov", { file: "filecoin-lcov.info", projectRoot: "../" }], "text"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "filecoin-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
