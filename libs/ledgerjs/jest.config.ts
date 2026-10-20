import { createRequire } from "node:module";
const { withEsmDeps } = createRequire(import.meta.url)("@support/jest-shared");

const config = {
  testEnvironment: "node",
  testRegex: ".test.ts$",
  collectCoverage: true,
  testPathIgnorePatterns: ["packages/*/lib-es", "packages/*/lib"],
  coveragePathIgnorePatterns: ["packages/create-dapp"],
  passWithNoTests: true,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
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
  // collectCoverageFrom: ["packages/**/src/*.ts"],
};

export default withEsmDeps(config);
