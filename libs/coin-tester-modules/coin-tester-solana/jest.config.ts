import type { Config } from "jest";
import { mswEsmPnpmDirs, mswTransform } from "@support/jest-msw";

const esmDeps = ["ky"];

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  transform: {
    ...mswTransform,
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
  transformIgnorePatterns: [
    `node_modules/.pnpm/(?!(${[...esmDeps, ...mswEsmPnpmDirs].join("|")}))`,
  ],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
