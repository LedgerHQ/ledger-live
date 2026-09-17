import { defineConfig } from "oxlint";
import base from "@support/lint-base";

export default defineConfig({
  extends: [base],
  ignorePatterns: ["*.js", "*.cjs", "*.mjs", "node_modules"],
  rules: {
    // devtools is the only layer on the automatic JSX runtime: 104 of its 109 JSX files carry no
    // React import. Everywhere else the rule stays on, because those layers still need one.
    "react/react-in-jsx-scope": "off",
    // devtools is the one layer already enforcing the platform-suffix rule; keep it fatal here.
    "suffix-imports/no-platform-suffix": "error",
    // Devtools talk to the developer through the console; that is the product, not a slip.
    "eslint/no-console": "off",
  },
});
