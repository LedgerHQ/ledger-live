const { mswEsmPnpmDirs, mswTransform } = require("@support/jest-msw");

module.exports = {
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${mswEsmPnpmDirs.join("|")}))`],
  transform: {
    ...mswTransform,
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    "@ledgerhq/test-quarantine/jest",
  ],
};
