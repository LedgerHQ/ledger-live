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
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};
