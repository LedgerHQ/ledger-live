import type { Config } from "jest";
import { mswEsmPnpmDirs, mswTransform } from "@support/jest-msw";

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${mswEsmPnpmDirs.join("|")}))`],
  transform: {
    ...mswTransform,
    "^.+\\.tsx?$": [
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
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
