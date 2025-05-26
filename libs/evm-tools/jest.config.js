/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "./src/__tests__/tsconfig.json",
    },
  },
  testEnvironment: "node",
  coverageDirectory: "./coverage/",
  collectCoverage: true,
  coveragePathIgnorePatterns: ["src/__tests__"],
  testRegex: ".(test|spec).[jt]sx?$",
  moduleDirectories: ["node_modules"],
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  modulePathIgnorePatterns: ["__tests__/fixtures"],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text", "clover"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
