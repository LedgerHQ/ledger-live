import { defineConfig } from "oxlint";
import base from "@support/lint-base";

export default defineConfig({
  extends: [base],
  ignorePatterns: ["*.js", "*.cjs", "*.mjs", "node_modules"],
  rules: {},
});
