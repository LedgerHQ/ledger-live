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
    "node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?)/.)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest/mocks/native-ui.tsx", "<rootDir>/jest/setup.native.ts"],
};
