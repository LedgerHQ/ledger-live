module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
          parser: {
            syntax: "typescript",
            tsx: false,
            decorators: false,
            dynamicImport: true,
          },
        },
      },
    ],
  },
  testEnvironment: "node",
  coverageDirectory: "./coverage/",
  collectCoverage: true,
  coveragePathIgnorePatterns: ["src/__tests__"],
  testRegex: ".(test|spec).[jt]sx?$",
  moduleDirectories: ["node_modules"],
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  coverageReporters: [
    "json",
    ["lcov", { file: "lcov.info", projectRoot: "../../" }],
    "text",
    "clover",
  ],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
