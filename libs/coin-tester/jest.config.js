/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".(test|spec).[jt]sx?$",
  moduleDirectories: ["node_modules"],
  setupFiles: ["dotenv/config"],
};
