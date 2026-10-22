import { defineConfig } from "oxlint";
import base from "./libs.mts";

// The coin testers are harnesses: each package's top-level src files report progress to the
// console, which is the tool's output rather than a slip. The glob anchors to the directory of the
// layer config that names this preset, so `*/src/*` means one coin tester's own entry files, the
// same set the config this replaced allowed.
export default defineConfig({
  extends: [base],
  // The coin testers run the correctness rules as errors and the suspicious ones as warnings, as
  // the layers with a full config do, rather than the correctness warnings of the libs preset.
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  overrides: [
    {
      files: ["*/src/*.{ts,tsx}"],
      rules: { "eslint/no-console": "off" },
    },
  ],
});
