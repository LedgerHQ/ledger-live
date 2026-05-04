module.exports = {
  preset: "react-native",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.native.test.{ts,tsx}"],
  transform: {
    // SWC handles our TypeScript/TSX source files
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
    // babel-jest handles .js files from React Native packages (they use Flow types)
    "^.+\\.jsx?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm|(jest-)?react-native|react-native-safe-area-context|react-native-reanimated|react-native-worklets|@react-native(-community)?|@gorhom/bottom-sheet|@ledgerhq/lumen-.*)/.)",
  ],
  modulePaths: ["<rootDir>"],
  moduleNameMapper: {
    "^jest/render\\.native$": "<rootDir>/jest/render/index.native.tsx",
    "^@ledgerhq/lumen-ui-rnative$":
      "<rootDir>/node_modules/@ledgerhq/lumen-ui-rnative/src/index.ts",
    "^@ledgerhq/lumen-design-core$": "<rootDir>/node_modules/@ledgerhq/lumen-design-core",
    "^@sbaiahmed1/react-native-blur$": "<rootDir>/jest/mocks/react-native-blur.tsx",
    "^react-native-worklets$": "<rootDir>/jest/mocks/react-native-worklets.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest/setup.native.ts"],
};
