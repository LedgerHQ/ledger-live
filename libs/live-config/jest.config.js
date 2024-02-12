module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
