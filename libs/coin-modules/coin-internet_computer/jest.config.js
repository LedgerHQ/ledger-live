// ESM-only dependencies of @icp-sdk/core, which jest must transform to load from CommonJS.
const esmPackages = ["@noble", "@scure"];

module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    // Vendored generated candid factories — excluded from coverage.
    "!src/network/idl/**",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    [`node_modules/\\.pnpm/(${esmPackages.join("|")}).+\\.m?js$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/\\.pnpm/(?!(${esmPackages.join("|")}))`],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts", "\\.integ\\.test\\.ts$"],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
};
