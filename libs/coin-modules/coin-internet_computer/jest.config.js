/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  passWithNoTests: true,
};
