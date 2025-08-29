module.exports = {
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        globals: {
          isolatedModules: true,
        },
      },
    ],
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testPathIgnorePatterns: ["lib/", "lib-es/", "src/__tests__/setup.ts"],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
