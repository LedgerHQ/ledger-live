import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  // Resolve @ledgerhq workspace packages (coin-ton, live-common, …) from TypeScript source, as
  // coin-tester-bitcoin does.
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["<rootDir>/src/scenarii.test.ts"],
  // Started and stopped outside the scenario, so a failing setup still tears the chain down.
  globalSetup: "<rootDir>/src/globalSetup.ts",
  globalTeardown: "<rootDir>/src/globalTeardown.ts",
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
