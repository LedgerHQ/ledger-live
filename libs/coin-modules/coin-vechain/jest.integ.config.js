const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "./src/test/coinConfig.integ.setup.ts",
  ],
});
