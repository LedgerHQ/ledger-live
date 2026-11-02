const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  // Exception listed in support/jest/core/preset-overrides.js.
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
        module: {
          type: "commonjs",
          ignoreDynamic: true,
        },
      },
    ],
  },
});
