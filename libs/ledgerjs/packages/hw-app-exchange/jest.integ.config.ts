import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  testRegex: ".integ.test.ts$",
};
