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
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};
