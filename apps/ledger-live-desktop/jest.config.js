module.exports = {
  globals: {
    __DEV__: false,
    __APP_VERSION__: "2.0.0",
  },
  globalSetup: "<rootDir>/tests/setup.js",
  setupFiles: ["<rootDir>/tests/jestSetup.js"],
  moduleNameMapper: {
    "^@polkadot/([^/]+)/(.+)$": [
      "@polkadot/$1/index.cjs",
      "@polkadot/$1/node.cjs",
      "@polkadot/$1/$2.cjs",
      "@polkadot/$1/cjs/$2",
      "@polkadot/$1/$2",
    ],
  },
};
