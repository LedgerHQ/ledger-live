import { defineConfig } from "oxlint";
import base from "@support/lint-base";

// tools/ is build-time scripting: node only, no DOM, and its build output is checked in under
// build/ in a few packages. It names no rule of its own; the one it used to set,
// `typescript/no-explicit-any: warn`, is already the lint-base value.
export default defineConfig({
  extends: [base],
  env: { node: true },
  ignorePatterns: ["**/build/**"],
  rules: {
    // These are build and release scripts. The console is their output, not a slip.
    "eslint/no-console": "off",
  },
});
