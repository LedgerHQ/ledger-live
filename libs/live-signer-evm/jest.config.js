const { withEsmDeps } = require("@support/jest-shared");

const config = {
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
  reporters: [
    "default",
    ...(process.env.CI ? ["github-actions"] : []),
    "@ledgerhq/test-quarantine/jest",
  ],
  setupFilesAfterEnv: ["@ledgerhq/test-quarantine/jest-retries"],
};

module.exports = withEsmDeps(config, { extraDeps: ["@ledgerhq\\+"] });
