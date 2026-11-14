import { defineConfig } from "oxlint";
import base from "./libs.mts";
import {
  BIGNUMBER_NAMED_IMPORT,
  COIN_MODULE_CREATE_API,
  COIN_MODULE_LAYER_IMPORTS,
} from "./restricted-imports.mts";

// The coin modules, and wallet-btc beside them. They run the correctness rules as errors and the
// suspicious ones as warnings, forbid import cycles, and keep the generic coin framework between
// a coin module and the rest of the wallet.
//
// A preset rather than an override in `libs`: an override cannot set `categories`, and the
// correctness rules are errors here but warnings in the rest of libs/. The base and libs test
// overrides come through `extends`; the coin modules' own test override comes after them and
// covers every test file these packages have, all under src/.
export default defineConfig({
  extends: [base],
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  rules: {
    // What the coin modules add.
    "eslint/eqeqeq": "error",
    "eslint/no-restricted-imports": [
      "error",
      { paths: [BIGNUMBER_NAMED_IMPORT], patterns: [COIN_MODULE_CREATE_API] },
    ],
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
      files: ["**/src/logic/**", "**/src/network/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "warn",
          {
            paths: [BIGNUMBER_NAMED_IMPORT],
            patterns: [COIN_MODULE_LAYER_IMPORTS],
          },
        ],
      },
    },
    {
      files: ["**/src/api/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            paths: [BIGNUMBER_NAMED_IMPORT],
            patterns: [COIN_MODULE_CREATE_API, COIN_MODULE_LAYER_IMPORTS],
          },
        ],
      },
    },
    {
      files: [
        "coin-cardano/src/api/getTransactions.ts",
        "coin-concordium/src/api/index.ts",
        "coin-icon/src/api/index.ts",
        "coin-icon/src/api/node.ts",
        "coin-sui/src/api/chain/index.ts",
      ],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            paths: [BIGNUMBER_NAMED_IMPORT],
            patterns: [COIN_MODULE_CREATE_API],
          },
        ],
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
        "eslint/no-restricted-imports": [
          "error",
          { paths: [BIGNUMBER_NAMED_IMPORT] },
        ],
      },
    },
    {
      files: [
        "coin-celo/src/api/index.ts",
        "coin-celo/src/bridge/synchronisation.ts",
      ],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          { paths: [BIGNUMBER_NAMED_IMPORT] },
        ],
      },
    },
    {
      // coin-bitcoin and wallet-btc have import cycles they have not broken yet. The globs anchor
      // to the layer config: `coin-bitcoin/` under libs/coin-modules, `src/` under libs/wallet-btc.
      files: ["coin-bitcoin/**", "src/**"],
      rules: { "import/no-cycle": "warn" },
    },
  ],
});
