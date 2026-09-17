import { defineConfig } from "oxlint";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: ["typescript", "import"],
  jsPlugins: [fileURLToPath(new URL("./src/suffix-imports.js", import.meta.url))],
  categories: { correctness: "error" },
  rules: {
    "typescript/no-explicit-any": "error",
    "suffix-imports/no-platform-suffix": "error",
  },
  overrides: [
    { files: ["**/spike-waived/**"], rules: { "typescript/no-explicit-any": "off" } },
    { files: ["spike/consumer/src/**"], rules: { "eslint/no-debugger": "off" } },
  ],
});
