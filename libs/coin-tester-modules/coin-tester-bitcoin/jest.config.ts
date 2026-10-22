import type { Config } from "jest";

const esmDeps = ["@noble\\+"];

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  transform: {
    "^.+\\.tsx?$": [
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
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};

export default config;
