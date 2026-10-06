import type { Config } from "jest";

const sharedConfig = {
  testEnvironment: "node" as const,
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  testEnvironmentOptions: {
    // Test coin-aleo from source, without a prior build.
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
        module: {
          type: "commonjs",
          ignoreDynamic: true, // keeps import() native for the ESM-only SDK (src/wasm.ts)
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"] as string[],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/lib/", "/lib-es/"],
};

const STACK_SUITES = ["scenarii", "negativeCases", "listOperations"];

const config: Config = {
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testMatch: ["<rootDir>/src/**/*.test.ts"],
      testPathIgnorePatterns: [
        ...sharedConfig.testPathIgnorePatterns,
        ...STACK_SUITES.map(suite => `<rootDir>/src/${suite}\\.test\\.ts$`),
      ],
    },
    {
      ...sharedConfig,
      displayName: "stack",
      testMatch: STACK_SUITES.map(suite => `<rootDir>/src/${suite}.test.ts`),
    },
  ],
};

export default config;
