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
  coverageReporters: ["json", ["lcov", { file: "aptos-lcov.info", projectRoot: "../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "aptos-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
  coveragePathIgnorePatterns: [
    "src/test",
    "src/types",
    "src/index.ts",
    "src/bridge/bridge.fixture.ts",
  ],
};
