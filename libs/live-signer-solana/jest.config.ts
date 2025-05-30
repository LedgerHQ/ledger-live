/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
};
