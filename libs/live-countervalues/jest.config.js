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
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};
