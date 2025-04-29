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
  coverageReporters: ["json", ["lcov", { file: "polkadot-lcov.info", projectRoot: "../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.[tj]s"],
  setupFilesAfterEnv: ["jest-expect-message", "dotenv/config"],
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "polkadot-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
