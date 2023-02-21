const { defaults: tsjPreset } = require("ts-jest/presets");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...tsjPreset,
  verbose: true,
  preset: "react-native",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  globals: {
    "ts-jest": {
      babelConfig: true,
    },
  },
  testMatch: ["**/src/**/*.test.(ts|tsx)"],
  transform: {
    "^.+\\.js?$": "babel-jest",
    "^.+\\.tsx?$": "ts-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm|@react-native/polyfills|react-native)/)",
    "\\.pnp\\.[^\\/]+$",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  coverageReporters: ["json"],
  coverageDirectory: "<rootDir>/coverage",
};
