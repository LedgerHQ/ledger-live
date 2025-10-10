/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  modulePathIgnorePatterns: [
    "__tests__/fixtures",
    "__tests__/integration/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
};
