import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  testEnvironmentOptions: {
    // Resolve workspace packages to their TypeScript source via the @ledgerhq/source
    // export condition. Packages are symlinked but not pre-built in dev/CI environments.
    customExportConditions: ["@ledgerhq/source"],
  },
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
  testMatch: ["**/src/tests/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/src/tests/integration/"],
  setupFilesAfterEnv: ["dotenv/config"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/tests/**", "!src/index.ts"],
  coverageReporters: ["json", ["lcov", { projectRoot: "../../../" }], "json-summary", "text"],
  reporters: [
    "default",
    [
      "jest-sonar",
      {
        outputName: "sonar-executionTests-report.xml",
        reportedFilePath: "absolute",
      },
    ],
  ],
};

export default config;
