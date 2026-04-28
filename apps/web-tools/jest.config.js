module.exports = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["node_modules/", "dist/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
          parser: { syntax: "typescript", tsx: true },
        },
      },
    ],
  },
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
};
