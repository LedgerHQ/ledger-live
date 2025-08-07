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
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integ.test.ts"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  coveragePathIgnorePatterns: ["src/test", "src/types", "src/index.ts"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
