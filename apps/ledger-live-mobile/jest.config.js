/** @type {import('ts-jest').JestConfigWithTsJest} */
module.export = {
  preset: "react-native",
  transform: {
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx"],
  coverageReporters: ["json"],
  coverageDirectory: "<rootDir>/coverage",
};
