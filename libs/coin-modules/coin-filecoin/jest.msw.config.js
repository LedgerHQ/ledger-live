/**
 * Jest configuration for MSW integration tests.
 *
 * MSW's request interceptors conflict with nock's `disableNetConnect()` from
 * `@ledgerhq/disable-network-setup`, so this config omits that setup file.
 *
 * Run: pnpm test-msw
 */
module.exports = {
  ...require("./jest.config"),
  setupFilesAfterEnv: ["<rootDir>/src/logic/tests/helpers/msw-setup.ts"],
  testMatch: ["**/*.msw.test.ts"],
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};
