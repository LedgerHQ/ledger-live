/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".monitor.test.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  testTimeout: 180000,
};
