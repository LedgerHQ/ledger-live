// The packages allowed to override a key their preset owns, keyed by package path from the
// repository root, then by the factory their config calls. A factory finds the entry from the
// `rootDir` it gets. This list only shrinks: a listed key the config no longer overrides throws.

const { deepFreeze } = require("../internals/freeze");

/** @type {Record<string, { reason: string, overrides: Record<string, string[]> }>} */
const PRESET_OVERRIDES = {
  "shared/i18n": {
    reason: "React views on the node preset: no preset covers a web-only shared/ package yet.",
    overrides: { createSharedJestConfig: ["testEnvironment", "transform"] },
  },
  "shared/linking": {
    reason: "React hooks on the node preset: no preset covers a web-only shared/ package yet.",
    overrides: { createSharedJestConfig: ["globals", "testEnvironment", "transform"] },
  },
  "libs/coin-modules/coin-aleo": {
    reason: "Keeps dynamic import() native for the ESM-only @provablehq/sdk in its live suites.",
    overrides: { createLibsCoinIntegJestConfig: ["transform"] },
  },
  "libs/coin-modules/coin-sui": {
    reason: "The @mysten packages ship .mjs files, which extraEsmDeps does not transform.",
    overrides: {
      createLibsCoinJestConfig: ["transform", "transformIgnorePatterns"],
      createLibsCoinIntegJestConfig: ["transform", "transformIgnorePatterns"],
    },
  },
};

module.exports = deepFreeze(PRESET_OVERRIDES);
