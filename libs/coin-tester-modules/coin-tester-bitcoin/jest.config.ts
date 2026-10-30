import type { Config } from "jest";

// Packages under node_modules/.pnpm that Jest must transform: @noble ships ESM only, and the
// @ledgerhq packages resolve to their TypeScript source (`@ledgerhq/source`, below).
const esmDeps = ["@noble\\+", "@ledgerhq\\+"];

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  // Resolve @ledgerhq workspace packages (coin-bitcoin, live-common, …) from TypeScript source via
  // the `@ledgerhq/source` export condition, so Jest transforms them with @swc/jest instead of
  // loading the ESM `lib-es` build. Mirrors coin-tester-kaspa.
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
    [`node_modules[\\\\|/].pnpm[\\\\|/](${esmDeps.join("|")}).+\\.js$`]: [
      "@swc/jest",
      { jsc: { target: "esnext" } },
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmDeps.join("|")}))`],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
