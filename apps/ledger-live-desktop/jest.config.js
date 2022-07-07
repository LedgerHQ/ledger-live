module.exports = {
  globals: {
    __DEV__: false,
    __APP_VERSION__: "2.0.0",
  },
  globalSetup: "<rootDir>/tests/setup.js",
  setupFiles: ["<rootDir>/tests/jestSetup.js"],
};
