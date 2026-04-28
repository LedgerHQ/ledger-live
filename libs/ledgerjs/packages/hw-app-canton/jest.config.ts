import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../jest.config.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  ...baseConfig,
  rootDir: __dirname,
  testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, ".*\\.integ\\.test\\.[tj]s"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__tests__/**",
    "!tests/**",
  ],
  coverageReporters: ["json", ["lcov", { projectRoot: "../../../../" }], "json-summary", "text"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    [
      "jest-sonar",
      {
        outputName: "sonar-executionTests-report.xml",
        reportedFilePath: "absolute",
      },
    ],
  ],
};
