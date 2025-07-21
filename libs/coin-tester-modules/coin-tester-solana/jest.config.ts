import type { Config } from "jest";

const transformIncludePatterns = ["ky"];

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    [`node_modules/.pnpm/(${transformIncludePatterns.join("|")}).+\\.(js|jsx)?$`]: [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  setupFilesAfterEnv: ["dotenv/config"],
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformIncludePatterns.join("|")}))`],
};

export default config;
