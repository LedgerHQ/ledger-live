/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  modulePathIgnorePatterns: [
    "/bridge.integration.test.ts", // this file is tested at the live-common level
  ],
  collectCoverage: true,
  coverageReporters: ["json", "html"],
};
