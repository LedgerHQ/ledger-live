import { defineConfig } from "oxlint";
import base from "./base.mts";
import { sliceSelectorsWaivers } from "./src/redux-slices.js";
import { platformSuffixWaivers } from "./src/suffix-imports.js";

const PLATFORM_SUFFIX_WAIVERS: string[] = [];

const SLICE_SELECTORS_WAIVERS: string[] = [
  "shared/app-config",
  "shared/feature-flags",
  "shared/live-config-overrides",
];

export default defineConfig({
  extends: [base],
  rules: {
    "suffix-imports/no-platform-suffix": "error",
    "redux-slices/selectors-in-slice": "error",
  },
  overrides: [
    platformSuffixWaivers(PLATFORM_SUFFIX_WAIVERS),
    sliceSelectorsWaivers(SLICE_SELECTORS_WAIVERS),
  ],
});
