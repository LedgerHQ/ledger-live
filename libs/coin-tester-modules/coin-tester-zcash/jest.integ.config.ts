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
            decorators: false,
            dynamicImport: true,
          },
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/src/tests/integration/**/*.test.ts"],
  testTimeout: 300_000,
  setupFilesAfterEnv: ["dotenv/config"],
  // The native Rust engine (napi-rs) keeps a libuv reference alive after sync completes,
  // preventing the Node.js event loop from exiting naturally.
  forceExit: true,
};

export default config;
