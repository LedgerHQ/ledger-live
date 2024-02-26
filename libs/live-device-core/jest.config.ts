import type { Config } from "jest";

const config: Config = {
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "ts-jest",
      {
        globals: {
          isolatedModules: true,
        },
      },
    ],
  },
  testPathIgnorePatterns: ["lib/", "lib-es/"],
};

export default config;
