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
  reporters: [
    "default",
    ["jest-sonar", { outputName: "sonar-executionTests-report.xml", reportedFilePath: "absolute" }],
    ...(process.env.CI ? ["github-actions"] : []),
  ],
};
