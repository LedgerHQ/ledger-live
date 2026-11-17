import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  // Resolve @ledgerhq workspace packages (coin-internet_computer, …) from TypeScript source.
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  // @icp-sdk/core depends on ESM-only @noble and @scure packages.
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!(@ledgerhq|@noble|@scure)\\+)"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["<rootDir>/src/*.test.ts"],
  // Started and stopped outside the tests, so a failing setup still tears the network down.
  globalSetup: "<rootDir>/src/globalSetup.ts",
  globalTeardown: "<rootDir>/src/globalTeardown.ts",
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
