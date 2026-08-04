module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,js,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__integration__/**",
    "!src/**/__integrations__/**",
    "!src/**/__tests__/**",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  globalSetup: "<rootDir>/jest-global-setup.js",
  passWithNoTests: true,
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  // wallet-framework-test-setup wires domain data into the framework's ports at test time.
  // Loaded by relative path (not as a package dep) so the public framework carries no
  // package.json edge back to it — that edge is what nx flags as a cyclic dependency.
  setupFilesAfterEnv: [
    "<rootDir>/../wallet-framework-test-setup/src/index.js",
    "<rootDir>/src/setup.ts",
  ],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@ledgerhq/ledger-wallet-framework/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["lib/", "lib-es/", "\\.integration\\.test\\.ts$"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
};
