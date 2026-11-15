import { defineConfig } from "oxlint";
import base from "./base.mts";

export default defineConfig({
  extends: [base],
  rules: {
    "suffix-imports/no-platform-suffix": "error",
  },
});
