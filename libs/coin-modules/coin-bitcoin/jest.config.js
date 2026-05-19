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
    "!src/chain-adapters/zcash/ipc/**/*.ts",
    "!src/chain-adapters/zcash/stubs/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
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
    "^@ledgerhq/coin-bitcoin/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.(integ|integration)\\.test\\.ts"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  // setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
