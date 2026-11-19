import { defineConfig } from "oxlint";
import base from "./base.mts";
import { sliceSelectorsWaivers } from "./src/redux-slices.js";

const SLICE_SELECTORS_WAIVERS: string[] = ["features/platform/app-lock"];

export default defineConfig({
  extends: [base],
  rules: {
    "suffix-imports/no-platform-suffix": "error",
    "redux-slices/selectors-in-slice": "error",
    "storage/no-engine-import": "error",
    "storage/no-port-import": "error",
  },
  overrides: [sliceSelectorsWaivers(SLICE_SELECTORS_WAIVERS)],
});
