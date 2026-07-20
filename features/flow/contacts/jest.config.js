const { createFlowNativeJestProject } = require("@features/platform-jest-config");

const swcTransform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    {
      jsc: {
        target: "esnext",
        parser: { syntax: "typescript", tsx: true },
        transform: { react: { runtime: "automatic" } },
      },
    },
  ],
};

const coverageReporters = [
  "json",
  ["lcov", { file: "lcov.info", projectRoot: "../../../" }],
  "text",
];

module.exports = {
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters,
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
  projects: [
    {
      displayName: "web",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/src"],
      testMatch: ["**/*.test.ts?(x)"],
      testPathIgnorePatterns: ["\\.native\\.test\\.tsx?$"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      transform: swcTransform,
      transformIgnorePatterns: [
        "node_modules/.pnpm/(?!(@ledgerhq\\+lumen-ui-react|@ledgerhq\\+lumen-design-core|@ledgerhq\\+lumen-utils-shared))",
      ],
    },
    createFlowNativeJestProject({
      roots: ["<rootDir>/src"],
      transform: swcTransform,
    }),
  ],
};
