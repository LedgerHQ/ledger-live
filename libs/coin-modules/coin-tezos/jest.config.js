/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  passWithNoTests: true,
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.[tj]s"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "tezos-lcov.info", projectRoot: "../" }], "text"],
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "tezos-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
