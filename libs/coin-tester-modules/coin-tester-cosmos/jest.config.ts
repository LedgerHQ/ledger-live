import type { Config } from "jest";

// Shaped like the sibling coin-testers (e.g. coin-tester-cardano). The
// load-bearing option is the `@ledgerhq/source` export condition: it resolves
// workspace @ledgerhq/* packages — notably @ledgerhq/coin-cosmos — from their
// TypeScript SOURCE, so this tester exercises the coin module's current source
// without a prior `pnpm build` of lib/.
//
// Unlike coin-tester-cardano there is no `setupFiles`: the Babylon scenario
// injects its config through `createBridges(() => coinConfig)` and points the
// LCD at the local node, so nothing needs to be set in the environment before
// coin-cosmos modules evaluate.
const config: Config = {
  testEnvironment: "node",
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "esnext" } }],
  },
  // @ledgerhq packages resolve to their TS source (via the condition above), so
  // swc must transform them even inside node_modules; everything else there
  // stays ignored.
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // @ledgerhq sources use ESM ".js" specifiers on ".ts" files; strip the
  // extension so jest resolves the TypeScript source.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
