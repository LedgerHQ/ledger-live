module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/__tests__/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@ledgerhq/wallet-btc/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.ts"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
