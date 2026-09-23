import { defineConfig } from "oxlint";
import base from "@support/lint-base";

export default defineConfig({
  extends: [base],
  rules: {
    // Reporters and CLI tooling in support/ write to the console by design.
    "eslint/no-console": "off",
  },
});
