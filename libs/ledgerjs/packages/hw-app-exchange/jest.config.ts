import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, ".*\\.integ\\.test\\.[tj]s"],
};
