/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: ["test/cli.ts", ".*\\.integration\\.test\\.[tj]s"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integration\\.test\\.[tj]s"],
};
