import type { Config } from "jest";

// `setupFiles` runs before coin-kaspa's config.ts captures API_KASPA_ENDPOINT at module-eval
// time, so the env var must be set there (not in setupFilesAfterEnv). Same pattern as
// coin-tester-cardano. The `@ledgerhq/source` export condition resolves workspace packages
// from TypeScript source so the tester runs without a prior build.
const config: Config = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/env.setup.ts"],
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
