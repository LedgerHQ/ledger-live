module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "@ledgerhq/test-quarantine/jest-retries"],
  testMatch: ["**/*.test.ts?(x)"],
  // These tests run the real feature hooks, and a feature package may ship a module with no
  // suffix-less file at all. This project is jsdom, so it falls back to the `.web` variant; the
  // plain extensions stay first, so every module that has one resolves exactly as before.
  moduleFileExtensions: ["tsx", "ts", "js", "jsx", "json", "node", "web.tsx", "web.ts"],
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
