const testPathIgnorePatterns = ["lib/", "lib-es/", "node_modules/"];

module.exports = {
  collectCoverage: true,
  coverageDirectory: "./coverage/",
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  testPathIgnorePatterns,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          target: "esnext",
        },
      },
    ],
  },
};
