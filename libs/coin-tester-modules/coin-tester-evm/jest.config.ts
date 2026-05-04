import type { Config } from "jest";

const esmDeps = ["ky"];

const config: Config = {
  testEnvironment: "node",
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
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmDeps.join("|")}))`],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
};

export default config;
