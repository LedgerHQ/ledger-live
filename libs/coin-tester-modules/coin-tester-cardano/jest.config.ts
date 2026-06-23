import type { Config } from "jest";

// Single config, shaped like the sibling coin-testers (e.g. coin-tester-tezos/jest.config.ts). The two
// Cardano-specific options are `setupFiles` (env.setup must run before coin-cardano's constants.ts
// captures CARDANO_API_ENDPOINT) and the `@ledgerhq/source` condition (resolve workspace @ledgerhq/*
// from TypeScript source so the tester runs without a prior `pnpm build`; mirrors ledger-live-common).
const config: Config = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/env.setup.ts"],
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  // @ledgerhq packages resolve to their TS source (via the condition above), so swc must
  // transform them even inside node_modules; everything else there stays ignored.
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // @ledgerhq sources use ESM ".js" specifiers on ".ts" files; strip the extension so jest
  // resolves the TypeScript source.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
