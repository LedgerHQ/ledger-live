module.exports = {
  verbose: true,
  testEnvironment: "node",
  testRegex: ".(test|spec).[jt]sx?$",
  moduleDirectories: ["node_modules"],
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
