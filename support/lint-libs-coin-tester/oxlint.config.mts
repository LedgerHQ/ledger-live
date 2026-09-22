import { defineConfig } from "oxlint";
import base from "@support/lint-libs/oxlint.config";

// The coin testers are harnesses: each package's top-level src files report progress to the
// console, which is the tool's output rather than a slip. The glob anchors to the directory of the
// layer config that names this preset, so `*/src/*` means one coin tester's own entry files, the
// same set the config this replaced allowed.
export default defineConfig({
  extends: [base],
  // lint-libs opts libs/ out of the categories, which suits the published tree. The coin testers
  // never did: their config named no categories at all, so they ran on oxlint's correctness
  // defaults, and folding them onto lint-libs unchanged would drop them from 83 rules to 33.
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  overrides: [
    {
      files: ["*/src/*.{ts,tsx}"],
      rules: { "eslint/no-console": "off" },
    },
  ],
});
