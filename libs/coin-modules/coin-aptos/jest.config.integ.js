/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".*\\.(integ|integration)\\.test\\.[tj]s",
  testPathIgnorePatterns: ["lib/", "lib-es/", "bridge.integration.test.ts"],
  testTimeout: 60_000,
};
