import type { Config } from "jest";

// near-api-js v7 depends on ESM-only @noble/@scure packages.
const esmDeps = ["ky", "@noble", "@scure"];

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    [`node_modules[\\\\|/].pnpm[\\\\|/](${esmDeps.join("|")}).+\\.(js|jsx|mjs)$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmDeps.join("|")}))`],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
