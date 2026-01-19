module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  setupFilesAfterEnv: ["<rootDir>/tests.setup.ts"],
  moduleNameMapper: {
    "^@ledgerhq/device-transport-kit-web-hid$":
      "<rootDir>/tests/__mocks__/device-transport-kit-web-hid.ts",
  },
  coverageReporters: ["json", ["lcov", { file: "lcov.info", projectRoot: "../../" }], "text"],
};
