import { defineConfig } from "oxlint";
import base from "./base.mts";

// Packages that still import with a platform suffix. Each entry goes when its package's cleanup
// lands, so the list only shrinks. Globs anchor to features/platform/, where the layer config
// re-exports this preset.
const PLATFORM_SUFFIX_WAIVERS = ["app-lock", "card", "contacts", "device-action-content", "style"];

export default defineConfig({
  extends: [base],
  rules: {
    "suffix-imports/no-platform-suffix": "error",
  },
  overrides: [
    {
      files: PLATFORM_SUFFIX_WAIVERS.map(pkg => `${pkg}/**`),
      rules: { "suffix-imports/no-platform-suffix": "off" },
    },
  ],
});
