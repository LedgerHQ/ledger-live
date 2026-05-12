module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["\\.native\\.test\\."],
  modulePaths: ["<rootDir>"],
  transformIgnorePatterns: [
    "node_modules/.pnpm/(?!(@ledgerhq\\+lumen-ui-react|@ledgerhq\\+lumen-design-core))",
  ],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
