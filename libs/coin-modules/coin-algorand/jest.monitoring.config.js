/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 120000,
  testMatch: ["**/index.monitor.test.ts"],
}; 