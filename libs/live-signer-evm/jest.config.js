module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
};
