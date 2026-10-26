const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

module.exports = createLibsCoinIntegJestConfig({
  rootDir: __dirname,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
        module: {
          type: "commonjs",
          // Keep dynamic import() as native so Node.js loads
          // ESM-only packages (e.g. @provablehq/sdk) without going
          // through Jest's require()-based module registry.
          ignoreDynamic: true,
        },
      },
    ],
  },
});
