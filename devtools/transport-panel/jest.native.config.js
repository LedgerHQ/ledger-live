module.exports = {
  preset: "react-native",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.native.test.{ts,tsx}"],
  transform: {
    "^.+\\.(t)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          transform: {
            react: { runtime: "automatic" },
          },
        },
      },
    ],
    "^.+\\.jsx?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm|(jest-)?react-native|react-native-safe-area-context|react-native-reanimated|react-native-worklets|react-native-screens|@react-native(-community)?|@gorhom/bottom-sheet|@ledgerhq/lumen-.*)/.)",
  ],
  modulePaths: ["<rootDir>"],
  moduleNameMapper: {
    "^jest/render\\.native$": "<rootDir>/jest/render/index.native.tsx",
    "^jest/mocks/transport$": "<rootDir>/jest/mocks/transport.ts",
    "^@ledgerhq/lumen-ui-rnative$":
      "<rootDir>/node_modules/@ledgerhq/lumen-ui-rnative/src/index.ts",
    "^@ledgerhq/lumen-design-core$": "<rootDir>/node_modules/@ledgerhq/lumen-design-core",
    "^@sbaiahmed1/react-native-blur$": "<rootDir>/jest/mocks/react-native-blur.tsx",
    "^react-native-worklets$": "<rootDir>/jest/mocks/react-native-worklets.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest/setup.native.ts"],
  coverageReporters: [
    "json",
    ["lcov", { file: "lcov.native.info", projectRoot: "../../" }],
    "text",
  ],
  reporters: [
    "default",
    [
      "jest-sonar",
      { outputName: "sonar-executionTests-native-report.xml", reportedFilePath: "absolute" },
    ],
  ],
};
