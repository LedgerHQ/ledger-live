module.exports = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/"],
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
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};
