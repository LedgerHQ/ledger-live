// Configs that still override a key outside the jest rule's allowlist; the policy is in jest.mjs.

/** @type {Record<string, string[]>} repo-relative config path to the keys it may override */
export const JEST_DEBT = {
  // A jsdom environment and a React transform: the package tests React views with the node preset.
  // Exit condition: a preset covers a web-only shared/ package.
  "shared/i18n/jest.config.js": ["testEnvironment", "transform"],
  "shared/linking/jest.config.js": ["globals", "testEnvironment", "transform"],
  "shared/env/jest.config.js": ["modulePaths"],
  "libs/ledgerjs/jest.config.ts": ["collectCoverage"],
  "libs/live-signer-evm/jest.config.js": ["testEnvironmentOptions"],
  // Keeps dynamic import() native for the ESM-only @provablehq/sdk. Exit condition: the preset
  // offers that transform.
  "libs/coin-modules/coin-aleo/jest.integ.config.js": ["transform"],
  // The @mysten packages ship `.mjs` files, which the preset's ESM transform does not cover. Exit
  // condition: `extraEsmDeps` covers `.mjs` files.
  "libs/coin-modules/coin-sui/jest.config.js": ["transform", "transformIgnorePatterns"],
  "libs/coin-modules/coin-sui/jest.integ.config.js": ["transform", "transformIgnorePatterns"],
};
