/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
    "!src/datasets/**/*.ts",
    "!src/wallet-btc/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "text"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  reporters: [
    [
      "jest-sonar",
      { outputName: "bitcoin-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
