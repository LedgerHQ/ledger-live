import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/env.setup.ts"],
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  // Resolve workspace (and externally-published-but-source-resolvable) @ledgerhq/* packages —
  // notably live-common's generic-coin-framework and @ledgerhq/coin-module-framework — from TS
  // source rather than their built lib-es output, mirroring coin-tester-cardano.
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
