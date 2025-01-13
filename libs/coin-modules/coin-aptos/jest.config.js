/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
// `workerThreads: true` is required for validating object with `bigint` values
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
  // workerThreads: true,
};
