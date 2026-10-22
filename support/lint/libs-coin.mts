import { defineConfig } from "oxlint";
import base from "./libs.mts";

// The coin modules, and wallet-btc beside them. They run the correctness rules as errors and the
// suspicious ones as warnings, forbid import cycles, and keep the generic coin framework between
// a coin module and the rest of the wallet.
//
// `env`, `globals` and `settings` are re-declared rather than inherited: `extends` does not carry
// them through. The base and libs test overrides do come through; the coin modules' own test
// override comes after them and covers every test file these packages have, all under src/.
const createApiRestriction = {
  group: ["@ledgerhq/coin-*/api", "@ledgerhq/coin-*/api/*"],
  importNamePattern: "^createApi$",
  message:
    "Reach a coin module through getCoinModuleApi (bridge/generic-coin-framework/api), which " +
    "applies the framework's withDefaults. Since a module may omit the capabilities its chain " +
    "lacks, calling createApi directly yields an object with those methods missing, and the call " +
    "fails at runtime with nothing failing at compile time. If a direct call is genuinely " +
    "needed, add the file to the exemptions in this config and record in the PR why it cannot " +
    "break.",
};

export default defineConfig({
  extends: [base],
  env: { browser: true, es6: true, node: true },
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  globals: { Atomics: "readonly", SharedArrayBuffer: "readonly" },
  settings: { react: { version: "19.0.0" } },
  rules: {
    // The base value, re-declared: a rule's options do not survive `extends` either.
    "eslint/no-console": ["error", { allow: ["warn", "error"] }],

    // What the coin modules add.
    "eslint/eqeqeq": "error",
    "eslint/no-restricted-imports": ["error", { patterns: [createApiRestriction] }],
    "eslint/no-unsafe-optional-chaining": "warn",
    "import/no-cycle": "error",
    "jest/no-focused-tests": "warn",
    "no-unassigned-vars": "warn",
    "typescript/no-unused-vars": "warn",

    // Correctness and suspicious rules the base demotes and the coin modules run at their category.
    "eslint/no-useless-rename": "error",
    "import/namespace": "error",
    "import/no-named-as-default": "warn",
    "oxc/const-comparisons": "error",

    // Rules the coin modules never ran. React and jsx-a11y come with the base plugins; of their
    // rules only rules-of-hooks reports anything here, on test helpers named `use*`.
    "eslint/no-empty-pattern": "off",
    "eslint/no-useless-constructor": "off",
    "eslint/preserve-caught-error": "off",
    "import/no-duplicates": "off",
    "jest/no-export": "off",
    "react-hooks/rules-of-hooks": "off",
    "unicorn/no-array-reverse": "off",
    "unicorn/no-new-array": "off",
    "unicorn/no-useless-fallback-in-spread": "off",
    "unicorn/no-useless-spread": "off",
  },
  overrides: [
    {
      // The domain logic of a coin module depends on the framework, logs and network only.
      files: ["**/src/api/**", "**/src/logic/**", "**/src/network/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "warn",
          {
            patterns: [
              {
                group: [
                  "@ledgerhq/**",
                  "!@ledgerhq/logs",
                  "!@ledgerhq/logs/**",
                  "!@ledgerhq/live-network",
                  "!@ledgerhq/live-network/**",
                  "!@ledgerhq/coin-module-framework",
                  "!@ledgerhq/coin-module-framework/**",
                  "!@ledgerhq/ledger-wallet-framework",
                  "!@ledgerhq/ledger-wallet-framework/**",
                ],
              },
            ],
          },
        ],
      },
    },
    {
      files: ["**/src/api/**"],
      rules: {
        "eslint/no-restricted-imports": ["error", { patterns: [createApiRestriction] }],
      },
    },
    {
      files: [
        "**/src/**/*.test.{ts,tsx}",
        "**/src/**/__tests__/**",
        "**/src/**/test/**",
        "**/src/**/tests/**",
        "**/*.integ.test.{ts,tsx}",
      ],
      env: { jest: true },
      plugins: ["jest"],
      rules: {
        "jest/no-restricted-matchers": [
          "error",
          { toBeFalsy: null, toBeTruthy: null, toBeDefined: null },
        ],
        "eslint/no-console": "off",
        "typescript/no-explicit-any": "off",
        "typescript/consistent-type-assertions": "off",
        "eslint/no-restricted-imports": "off",
      },
    },
    {
      files: ["coin-celo/src/api/index.ts", "coin-celo/src/bridge/synchronisation.ts"],
      rules: { "eslint/no-restricted-imports": "off" },
    },
    {
      // coin-bitcoin and wallet-btc have import cycles they have not broken yet. The globs anchor
      // to the layer config: `coin-bitcoin/` under libs/coin-modules, `src/` under libs/wallet-btc.
      files: ["coin-bitcoin/**", "src/**"],
      rules: { "import/no-cycle": "warn" },
    },
  ],
});
