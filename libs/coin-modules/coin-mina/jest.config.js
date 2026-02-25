// `workerThreads: true` is required for validating object with `bigint` values
module.exports = {
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
  workerThreads: true,
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
