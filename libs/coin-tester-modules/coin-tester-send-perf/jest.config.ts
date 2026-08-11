import type { Config } from "jest";

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
            dynamicImport: true,
          },
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/src/**/*.test.ts"],
  setupFilesAfterEnv: ["dotenv/config"],
};

export default config;
