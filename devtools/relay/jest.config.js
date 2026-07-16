module.exports = {
  testEnvironment: "node",
  silent: true,
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
        module: {
          type: "commonjs",
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!@devtools/)"],
  moduleFileExtensions: ["ts", "js", "json"],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
