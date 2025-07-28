/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration|monitor)\\.test\\.[tj]s"],
  testTimeout: 60_000,
};
