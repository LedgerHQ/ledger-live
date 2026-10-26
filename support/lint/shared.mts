import { defineConfig } from "oxlint";
import base from "./base.mts";
import { platformSuffixWaivers } from "./src/suffix-imports.js";

const PLATFORM_SUFFIX_WAIVERS = [
  "clipboard",
  "lottie",
  "network-status",
  "ui-app-unavailable",
  "ui-info-state",
  "ui-qr-code",
  "ui-queued-bottom-sheet",
];

export default defineConfig({
  extends: [base],
  rules: {
    "suffix-imports/no-platform-suffix": "error",
  },
  overrides: [platformSuffixWaivers(PLATFORM_SUFFIX_WAIVERS)],
});
