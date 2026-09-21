import { defineConfig } from "oxlint";
import base from "@support/lint-base";

// libs/ is the legacy tree. It opts out of oxlint's categories entirely and enforces only the rules
// it names, which is what `libs/oxc-live-libs/.oxlintrc.json` did for its 49 consumers.
//
// `ignorePatterns`, `globals` and `settings` are re-declared rather than inherited: `extends` does
// not carry them through. Only `rules`, `plugins` and `categories` propagate.
export default defineConfig({
  extends: [base],
  categories: { correctness: "off", suspicious: "off", pedantic: "off" },
  globals: { Atomics: "readonly", SharedArrayBuffer: "readonly" },
  settings: { react: { version: "19.0.0" } },
  rules: {
    "typescript/no-empty-function": "off",
    "typescript/no-namespace": ["error", { allowDeclarations: true }],
    "jest/no-export": "off",
    "jsx-a11y/prefer-tag-over-role": "off",
    "jsx-a11y/anchor-is-valid": ["error", { components: [] }],
  },
  overrides: [
    {
      files: ["**/*.test.{ts,tsx}", "**/__tests__/**"],
      env: { jest: true },
      plugins: ["jest"],
      rules: { "typescript/no-explicit-any": "warn", "eslint/no-console": "off" },
    },
  ],
});
