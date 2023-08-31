const { defaults: tsjPreset } = require("ts-jest/presets");

const transformIncludePatterns = [
  "@react-native/polyfills",
  "(jest-)?react-native",
  "@react-native(-community)?",
  "rn-range-slider",
  "react-native-reanimated",
  "react-native-modal",
  "react-native-animatable",
  "@sentry/react-native",
  "react-native-startup-time",
  "@segment/analytics-react-native",
  "uuid",
];

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...tsjPreset,
  verbose: true,
  preset: "react-native",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect", "./jest-setup.js"],
  globals: {
    "ts-jest": {
      babelConfig: true,
    },
  },
  testMatch: ["**/src/**/*.test.(ts|tsx)"],
  transform: {
    "^.+\\.(js|jsx)?$": "babel-jest",
    "^.+\\.(ts|tsx)?$": "ts-jest",
  },
  transformIgnorePatterns: [
    `node_modules/(?!(.pnpm|${transformIncludePatterns.join("|")})/)`,
    "\\.pnp\\.[^\\/]+$",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleDirectories: ["node_modules"],
  coverageReporters: ["json"],
  coverageDirectory: "<rootDir>/coverage",
  moduleNameMapper: {
    "^react-native/(.*)$": "<rootDir>/node_modules/react-native/$1",
    "^react-native$": "<rootDir>/node_modules/react-native",
    "^victory-native$": "victory",
    "styled-components":
      "<rootDir>/node_modules/styled-components/native/dist/styled-components.native.cjs.js",
  },
};
