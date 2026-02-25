module.exports = {
  verbose: true,
  testEnvironment: "node",
  testRegex: ".(test|spec).[jt]sx?$",
  moduleDirectories: ["node_modules"],
  setupFiles: ["dotenv/config"],
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
};
