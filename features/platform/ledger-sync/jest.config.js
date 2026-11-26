module.exports = require("@support/jest/shared").createSharedJestConfig(
  { rootDir: __dirname, setupFiles: ["<rootDir>/src/__tests__/jsdomGlobals.ts"] },
  { esm: true },
);
