module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts?(x)"],
  // Web files import through suffix-free barrels; the native ones always pin `.native`.
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "@ledgerhq/test-quarantine/jest-retries"],
  transform: {
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
  },
  moduleNameMapper: {
    "^@ledgerhq/lumen-ui-react$": "<rootDir>/__mocks__/@ledgerhq/lumen-ui-react.tsx",
  },
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
};
