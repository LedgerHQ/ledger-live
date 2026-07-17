import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../jest.config.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  ...baseConfig,
  rootDir: __dirname,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
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
