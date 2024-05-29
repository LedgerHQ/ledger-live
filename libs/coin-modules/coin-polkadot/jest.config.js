/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.ts"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["jest-expect-message", "dotenv/config"],
};
