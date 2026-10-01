const { mswEsmPnpmDirs, mswTransform } = require("@support/jest-msw");

const transformIncludePatterns = ["ky"];

const sharedConfig = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".integration.test.ts", ".integ.test.ts"],
  transform: {
    ...mswTransform,
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    [`node_modules/.pnpm/(${transformIncludePatterns.join("|")}).+\\.(js|jsx)?$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [
    `node_modules/.pnpm/(?!(${[...transformIncludePatterns, ...mswEsmPnpmDirs].join("|")}))`,
  ],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
};

// `unit` runs with @ledgerhq/disable-network-setup, `msw` runs the `.msw.test.ts` suites without it:
// MSW intercepts below nock's `http.request` override, so nock would block every request first.
module.exports = {
  passWithNoTests: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/test/**/*.ts",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testPathIgnorePatterns: [...sharedConfig.testPathIgnorePatterns, "\\.msw\\.test\\.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/disable-network-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    },
    {
      ...sharedConfig,
      displayName: "msw",
      testMatch: ["**/*.msw.test.ts"],
      setupFilesAfterEnv: [
        "@ledgerhq/wallet-framework-test-setup",
        "@ledgerhq/test-quarantine/jest-retries",
      ],
    },
  ],
};
