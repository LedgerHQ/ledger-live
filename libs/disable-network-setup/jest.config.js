export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".test.ts$",
  setupFilesAfterEnv: ["./src/index.ts"],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
