/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
// `workerThreads: true` is required for validating object with `bigint` values
module.exports = {
  preset: "ts-jest",
  workerThreads: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  coveragePathIgnorePatterns: [
    "src/test",
    "src/types",
  ],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integ.test.ts"],
};
