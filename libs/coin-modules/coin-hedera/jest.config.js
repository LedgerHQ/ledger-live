/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
};
