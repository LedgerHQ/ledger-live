const path = require("path");

module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.native.test.ts?(x)"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          parser: { syntax: "typescript", tsx: true },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^react-native$": path.join(__dirname, "jest/mocks/react-native.js"),
    "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(__dirname, "jest/mocks/passthrough-native.js"),
  },
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
