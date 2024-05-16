/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  modulePathIgnorePatterns: [
    "__tests__/fixtures",
    "__tests__/coin-tester",
    "__tests__/integration/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
  setupFilesAfterEnv: ["jest-expect-message", "dotenv/config"],
};
