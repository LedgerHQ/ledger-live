import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.[tj]s"],
};
