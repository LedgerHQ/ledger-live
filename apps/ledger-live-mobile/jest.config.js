const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

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
  verbose: true,
  preset: "react-native",
  modulePaths: [compilerOptions.baseUrl],
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect", "./jest-setup.js"],
  testMatch: ["**/src/**/*.test.(ts|tsx)"],
  transform: {
    "^.+\\.(t)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [
    `node_modules/(?!(.pnpm|${transformIncludePatterns.join("|")})/)`,
    "\\.pnp\\.[^\\/]+$",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleDirectories: ["node_modules"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/__tests__/*.{ts,tsx}",
    "!src/__mocks__/*.{ts,tsx}",
  ],
  coverageReporters: ["json", "lcov", "json-summary"],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths),
    "^react-native/(.*)$": "<rootDir>/node_modules/react-native/$1",
    "^react-native$": "<rootDir>/node_modules/react-native",
    "^victory-native$": "victory",
    "styled-components":
      "<rootDir>/node_modules/styled-components/native/dist/styled-components.native.cjs.js",
  },
};
