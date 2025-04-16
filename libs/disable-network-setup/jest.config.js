export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: ".test.ts$",
  setupFilesAfterEnv: ["./src/index.ts"],
};
