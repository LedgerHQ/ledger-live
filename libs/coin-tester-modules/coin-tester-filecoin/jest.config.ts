import type { Config } from "jest";

// iso-filecoin and its helpers ship ESM only. The @ledgerhq packages resolve to their TypeScript
// source (the `@ledgerhq/source` condition below), so a run tests the code as it is, not a stale build.
const transformedDeps = [
  "@ledgerhq\\+",
  "ky",
  "@noble\\+",
  "@scure\\+",
  "iso-filecoin",
  "iso-base",
  "zod",
];

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
      },
    ],
    [`node_modules[\\\\|/].pnpm[\\\\|/](${transformedDeps.join("|")}).+\\.(js|jsx|mjs)$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformedDeps.join("|")}))`],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
