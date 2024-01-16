module.exports = {
  globalSetup: "<rootDir>/jest-global-setup.js",
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        globals: {
          isolatedModules: true,
        },
      },
    ],
  },
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};
