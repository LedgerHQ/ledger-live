import { defineConfig } from "oxlint";
import { configs as wdioConfigs } from "eslint-plugin-wdio";
import { BIGNUMBER_NAMED_IMPORT, RELATIVE_IMPORTS } from "@support/lint/restricted-imports";

const wdioRecommended = wdioConfigs["flat/recommended"];

export default defineConfig({
  env: { browser: true, node: true },
  globals: { Atomics: "readonly", SharedArrayBuffer: "readonly" },
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  plugins: ["eslint", "import", "oxc", "unicorn", "typescript"],
  jsPlugins: [{ name: "wdio", specifier: "eslint-plugin-wdio" }],
  ignorePatterns: ["node_modules", "artifacts/**", "**/*.json"],
  rules: {
    "eslint/no-unused-vars": "warn",
    "import/no-duplicates": "error",
    "typescript/no-deprecated": "error",
    "typescript/consistent-type-assertions": ["warn", { assertionStyle: "never" }],
    "unicorn/no-useless-fallback-in-spread": "off",
    "unicorn/no-useless-spread": "off",
    "eslint/no-restricted-imports": [
      "error",
      {
        paths: [BIGNUMBER_NAMED_IMPORT],
        patterns: [
          RELATIVE_IMPORTS,
          {
            group: ["~", "~/*", "~/**", "LLM", "LLM/*", "LLM/**"],
            message:
              "E2E tests must stay independent and not import Ledger Wallet Mobile app source through the '~' or 'LLM' aliases.",
          },
        ],
      },
    ],
    ...wdioRecommended.rules,
  },
});
