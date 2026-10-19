import { defineConfig } from "oxlint";
import base from "./base.mts";

// libs/ is the legacy tree. Most of its packages shared a config that turned oxlint's categories off
// and enforced only the rules it named; the others ran on oxlint's defaults, correctness rules as
// warnings. Correctness at warn keeps both: it adds warnings to the first group and takes nothing
// from the second.
//
// `ignorePatterns`, `globals` and `settings` are re-declared rather than inherited: `extends` does
// not carry them through. Only `rules`, `plugins` and `categories` propagate.
export default defineConfig({
  extends: [base],
  categories: { correctness: "warn", suspicious: "off", pedantic: "off" },
  globals: { Atomics: "readonly", SharedArrayBuffer: "readonly" },
  settings: { react: { version: "19.0.0" } },
  rules: {
    "typescript/no-empty-function": "off",
    "typescript/no-namespace": ["error", { allowDeclarations: true }],
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
