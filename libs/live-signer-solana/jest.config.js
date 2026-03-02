module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
