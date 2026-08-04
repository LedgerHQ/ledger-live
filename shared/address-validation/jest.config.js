const path = require("path");

const transform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    { jsc: { target: "esnext", parser: { syntax: "typescript", tsx: true } } },
  ],
};

const base = {
  roots: ["<rootDir>/src"],
  testPathIgnorePatterns: ["lib/", "lib-es/", "node_modules/"],
  transform,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  coverageReporters: [
    "json",
    ["lcov", { file: "lcov.info", projectRoot: "../../" }],
    "text",
  ],
};

module.exports = {
  collectCoverage: true,
  coverageDirectory: "./coverage/",
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
  projects: [
    {
      ...base,
      displayName: "web",
      testEnvironment: "jsdom",
      testMatch: ["**/*.web.test.ts?(x)", "**/*.web.spec.ts?(x)"],
      setupFilesAfterEnv: ["@testing-library/jest-dom"],
    },
    {
      ...base,
      displayName: "native",
      testEnvironment: "node",
      testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
      moduleNameMapper: {
        "^react-native$": path.join(__dirname, "jest/mocks/react-native.js"),
      },
    },
  ],
};
