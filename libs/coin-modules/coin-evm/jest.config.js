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
  coverageReporters: ["json", ["lcov", { file: "evm-lcov.info", projectRoot: "../" }], "text"],
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  modulePathIgnorePatterns: [
    "__tests__/fixtures",
    "__tests__/coin-tester",
    "__tests__/integration/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
  setupFilesAfterEnv: ["jest-expect-message", "dotenv/config"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "evm-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
