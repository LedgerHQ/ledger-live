module.exports = {
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        globals: {
          isolatedModules: true,
        },
      },
    ],
  },
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};
