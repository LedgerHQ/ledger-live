import type { Config } from "jest";

const transformIncludePatterns = ["ky"];

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
          parser: {
            syntax: "typescript",
            tsx: false,
            decorators: false,
            dynamicImport: true,
          },
        },
      },
    ],
    [`node_modules/.pnpm/(${transformIncludePatterns.join("|")}).+\\.(js|jsx)?$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformIncludePatterns.join("|")}))`],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  setupFilesAfterEnv: ["dotenv/config"],
};

export default config;
