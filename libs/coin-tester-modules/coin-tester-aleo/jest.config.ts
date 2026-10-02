import type { Config } from "jest";

// Two things carry weight here:
//  - `module: { type: "commonjs", ignoreDynamic: true }` keeps `import()` native,
//    so the ESM-only @provablehq/sdk loads through the loader in src/wasm.ts;
//  - the `@ledgerhq/source` export condition resolves workspace @ledgerhq/*
//    packages — @ledgerhq/coin-aleo above all — from their TypeScript sources, so
//    the tester exercises the current coin-aleo code without a prior `pnpm build`.
const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
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
        module: {
          type: "commonjs",
          ignoreDynamic: true,
        },
      },
    ],
  },
  // @ledgerhq packages resolve to their TS sources (condition above), so swc must
  // transform them inside node_modules too; everything else is left untouched.
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // @ledgerhq sources use ESM-style ".js" specifiers on ".ts" files.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/lib/", "/lib-es/"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
