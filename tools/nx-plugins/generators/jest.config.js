const path = require("path");

const workspaceRoot = path.resolve(__dirname, "../../..");

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
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
    "^@support/jest/devtools$": `${workspaceRoot}/support/jest/devtools/index.ts`,
    "^@support/jest/features-flow$": `${workspaceRoot}/support/jest/features-flow/index.ts`,
    "^@support/jest/libs-coin$": `${workspaceRoot}/support/jest/libs-coin/index.ts`,
    "^@support/jest/shared$": `${workspaceRoot}/support/jest/shared/index.ts`,
  },
};
