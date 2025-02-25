/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  coverageDirectory: "coverage",
  preset: "ts-jest",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
};
