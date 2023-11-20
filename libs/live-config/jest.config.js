module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
