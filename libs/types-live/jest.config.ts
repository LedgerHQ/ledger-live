export default {
  testEnvironment: "node",
  testRegex: ".test.ts$",
  collectCoverage: true,
  testPathIgnorePatterns: ["lib/", "lib-es/"],
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
  coverageReporters: ["json", ["lcov", { projectRoot: "../../" }], "json-summary", "text"],
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
