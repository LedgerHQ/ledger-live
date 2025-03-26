/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  globalSetup: "<rootDir>/jest-global-setup.js",
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.{ts,js,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__integration__/**",
    "!src/**/__integrations__/**",
    "!src/**/__tests__/**",
  ],
  coverageReporters: [
    "json",
    ["lcov", { file: "framework-lcov.info", projectRoot: "../" }],
    "text",
  ],
  reporters: [
    [
      "jest-sonar",
      { outputName: "framework-sonar-executionTests-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
