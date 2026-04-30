module.exports = {
  testEnvironment: "node",
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source"],
  },
  testPathIgnorePatterns: ["lib/", "lib-es/"],
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
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};
