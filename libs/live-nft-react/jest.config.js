module.exports = {
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
  testMatch: ["/**/*.test.(ts|tsx)"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};
