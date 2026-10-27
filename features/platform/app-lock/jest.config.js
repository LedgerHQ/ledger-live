const UI_FOLDERS = ["/PasswordField/", "/passwordDraft/"];

const nativeProject = require("@support/jest/features-flow")
  .createFlowJestConfig()
  .projects.find(project => project.displayName === "native");

module.exports = {
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      testMatch: ["**/*.test.ts"],
      testPathIgnorePatterns: ["/node_modules/", ...UI_FOLDERS],
      // Imports carry no platform suffix: `./biometrics` resolves to `biometrics.native.ts`.
      moduleFileExtensions: ["native.ts", "ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"],
      transform: {
        "^.+\\.(t|j)sx?$": [
          "@swc/jest",
          {
            jsc: {
              target: "esnext",
            },
          },
        ],
      },
      setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
    },
    {
      ...nativeProject,
      testMatch: UI_FOLDERS.map(folder => `<rootDir>/src${folder}**/*.test.ts?(x)`),
    },
  ],
};
