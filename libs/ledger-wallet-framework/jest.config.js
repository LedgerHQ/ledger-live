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
  setupFilesAfterEnv: ["<rootDir>/src/setup.ts"],
  testEnvironment: "node",
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
