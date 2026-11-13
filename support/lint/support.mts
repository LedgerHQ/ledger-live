import { defineConfig } from "oxlint";
import base from "./base.mts";

export default defineConfig({
  extends: [base],
  rules: {
    // Reporters and CLI tooling in support/ write to the console by design.
    "eslint/no-console": "off",
    // The slice-selectors convention covers domain/, shared/ and features/ only.
    "redux-slices/selectors-in-slice": "off",
  },
});
