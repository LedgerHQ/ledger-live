import baseConfig from "../../jest.config";

export default {
  ...baseConfig,
  rootDir: __dirname,
  transform: {
    "^.+\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  testEnvironment: "jsdom",
};
