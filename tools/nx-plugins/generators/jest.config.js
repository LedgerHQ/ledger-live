const path = require("path");

const workspaceRoot = path.resolve(__dirname, "../../..");

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.mts$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: false },
          target: "es2022",
        },
        module: { type: "commonjs" },
      },
    ],
    "^.+\\.tsx?$": ["@swc/jest"],
  },
  moduleFileExtensions: ["ts", "mts", "mjs", "js", "json"],
  moduleNameMapper: {
    "^@support/jest/(.*)$": `${workspaceRoot}/support/jest/$1/index.mts`,
  },
};
