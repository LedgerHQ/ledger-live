module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: ["test/cli.ts", ".*\\.integ\\.test\\.[tj]s"],
  coverageDirectory: "coverage",
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
  },
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
