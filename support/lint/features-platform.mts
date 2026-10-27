import { defineConfig } from "oxlint";
import base from "./base.mts";
import { platformSuffixWaivers } from "./src/suffix-imports.js";

const PLATFORM_SUFFIX_WAIVERS = ["card", "contacts", "device-action-content"];

export default defineConfig({
  extends: [base],
  rules: {
    "suffix-imports/no-platform-suffix": "error",
  },
  overrides: [platformSuffixWaivers(PLATFORM_SUFFIX_WAIVERS)],
});
