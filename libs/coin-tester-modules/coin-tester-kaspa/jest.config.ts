import type { Config } from "jest";

// Shared options reused by all projects.
// `setupFiles` runs before coin-kaspa's config.ts captures API_KASPA_ENDPOINT at module-eval
// time, so the env var must be set there (not in setupFilesAfterEnv). The `@ledgerhq/source`
// export condition resolves workspace packages from TypeScript source without a prior build.
const sharedConfig = {
  testEnvironment: "node" as const,
  setupFiles: ["<rootDir>/src/env.setup.ts"],
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"] as string[],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

const config: Config = {
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
  // Serial execution across all projects: test files share the same Docker stack and
  // on-chain state, so concurrent mining calls would race and produce 409s.
  // maxWorkers must live here (top-level) — it is ignored inside a projects entry.
  maxWorkers: 1,
  projects: [
    {
      ...sharedConfig,
      displayName: "devnet",
      // globalSetup/globalTeardown start/stop the Docker stack once for all devnet test files.
      // Both run in the main Jest process so kaspaNode's currentMiningAddress is shared between them.
      globalSetup: "<rootDir>/src/globalSetup.ts",
      globalTeardown: "<rootDir>/src/globalTeardown.ts",
      testMatch: [
        "<rootDir>/src/scenarii.test.ts",
        "<rootDir>/src/negativeCases.test.ts",
      ],
    },
  ],
};

export default config;
