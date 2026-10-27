const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinJestConfig(
  {
    rootDir: __dirname,
    collectCoverageFrom: ["!src/index.ts"],
    setupFilesAfterEnv: ["jest-expect-message", "dotenv/config"],
  },
  { network: true },
);
