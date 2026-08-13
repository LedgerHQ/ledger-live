module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.tsx?$": ["@swc/jest"],
  },
  moduleFileExtensions: ["ts", "js", "json"],
};
