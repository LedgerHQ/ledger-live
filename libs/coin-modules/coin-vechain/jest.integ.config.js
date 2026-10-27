const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  setupFilesAfterEnv: ["./src/test/coinConfig.integ.setup.ts"],
});
