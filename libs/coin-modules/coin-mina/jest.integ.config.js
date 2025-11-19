/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
// maxWorkers: 1 prevents worker serialization issues with HTTP clients that have circular references
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".integ.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  testTimeout: 60_000,
  maxWorkers: 1,
};
