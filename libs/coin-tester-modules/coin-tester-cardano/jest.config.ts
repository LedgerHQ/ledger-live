import type { Config } from "jest";

// Split into two projects so unit-only files don't require the Yaci devnet: the `devnet` project owns the
// devnet-backed suites (globalSetup boots the devnet once for them), while `unit` (pure logic /
// fixture-backed) runs with no devnet. Shared base mirrors the sibling coin-testers — env.setup +
// the @ledgerhq/source condition (resolve workspace @ledgerhq/* from TS source, no prior build).
const base = {
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
};

const config: Config = {
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
  projects: [
    {
      ...base,
      displayName: "unit",
      testMatch: [
        "<rootDir>/src/getValidators.test.ts",
        "<rootDir>/src/signer.test.ts",
        "<rootDir>/src/yaciAdapter.test.ts",
      ],
    },
    {
      ...base,
      displayName: "devnet",
      // Add new devnet-backed suites here so they share the one globalSetup-booted devnet.
      testMatch: [
        "<rootDir>/src/mintToken.test.ts",
        "<rootDir>/src/negativeCases.test.ts",
        "<rootDir>/src/scenarii.test.ts",
      ],
      globalSetup: "<rootDir>/src/globalSetup.ts",
      globalTeardown: "<rootDir>/src/globalTeardown.ts",
    },
  ],
};

export default config;
