module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: ["test/cli.ts", ".*\\.integration\\.test\\.[tj]s"],
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
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integration\\.test\\.[tj]s"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
