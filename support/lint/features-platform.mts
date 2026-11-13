import { defineConfig } from "oxlint";
import base from "./base.mts";
import { sliceSelectorsWaivers } from "./src/redux-slices.js";
import { platformSuffixWaivers } from "./src/suffix-imports.js";

const PLATFORM_SUFFIX_WAIVERS: string[] = [];

// Packages whose single-slice selectors are not nested in their slice yet.
const SLICE_SELECTORS_WAIVERS: string[] = [
  "features/platform/app-lock",
  "features/platform/market-countervalues",
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
