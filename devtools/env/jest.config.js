module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "@ledgerhq/test-quarantine/jest-retries"],
  testMatch: ["**/*.test.ts?(x)"],
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["\\.native\\.test\\."],
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
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
};
