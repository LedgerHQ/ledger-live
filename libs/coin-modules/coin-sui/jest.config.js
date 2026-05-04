const esmPackages = ["@mysten", "@scure", "@noble"];

module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: ["test/cli.ts", ".*\\.integ\\.test\\.[tj]s"],
  coverageDirectory: "coverage",
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../../" }], "text"],
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    [`node_modules/.pnpm/(${esmPackages.join("|")}).+\\.(js|mjs)?$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmPackages.join("|")}))`],
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
  ],
};
