module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  testPathIgnorePatterns: ["lib/"],
};
