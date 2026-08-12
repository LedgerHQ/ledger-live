import type { Config } from "jest";

const base = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  // Resolve workspace @ledgerhq/* packages from TS source rather than their built
  // lib/lib-es output, mirroring coin-tester-vechain and coin-tester-cardano.
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
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
  // The counterpart to customExportConditions: those packages then resolve to
  // untranspiled .ts under node_modules/.pnpm, which jest ignores by default.
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

const config: Config = {
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
  // The devnet suites share one devnet, so concurrency would race their balances.
  maxWorkers: 1,
  projects: [
    {
      ...base,
      displayName: "unit",
      testMatch: ["<rootDir>/src/signer.test.ts"],
    },
    {
      ...base,
      displayName: "devnet",
      testMatch: [
        "<rootDir>/src/devnet.test.ts",
        "<rootDir>/src/scenarii.test.ts",
        "<rootDir>/src/negativeCases.test.ts",
      ],
      globalSetup: "<rootDir>/src/globalSetup.ts",
      globalTeardown: "<rootDir>/src/globalTeardown.ts",
    },
  ],
};

export default config;
