const { mswEsmPnpmDirs, mswTransform } = require("@support/jest-msw");

const swcJest = require.resolve("@swc/jest");

module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
    "!src/__tests__/**/*.ts",
    "!src/__snapshots__/",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts", ".integ.test.ts"],
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${mswEsmPnpmDirs.join("|")}))`],
  transform: {
    ...mswTransform,
    "^.+\\.(ts|tsx)$": [
      swcJest,
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
  // @ledgerhq/disable-network-setup (nock) is intentionally not enabled — like coin-tezos,
  // because nock@14 + msw/node conflict for axios-based clients (@ledgerhq/live-network).
  // Network guard: unit tests mock the client; msw tests use onUnhandledFrame: "error".
  // setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "@ledgerhq/test-quarantine/jest-retries",
  ],
};
