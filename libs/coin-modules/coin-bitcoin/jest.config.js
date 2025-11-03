/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
    "!src/datasets/**/*.ts",
    "!src/wallet-btc/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  moduleNameMapper: {
    "^@ledgerhq/hw-app-btc/(.*)$": "<rootDir>/../../ledgerjs/packages/hw-app-btc/src/$1",
  },
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  // setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
