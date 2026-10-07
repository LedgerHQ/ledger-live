import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
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
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/lib/", "/lib-es/"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
  testMatch: ["<rootDir>/src/scenarii.test.ts"],
};

export default config;
