import { defineConfig } from "oxlint";
import base from "./base.mts";

// Packages that still import with a platform suffix. Each entry goes when its package's cleanup
// lands, so the list only shrinks. Globs anchor to shared/, where the layer config
// re-exports this preset.
const PLATFORM_SUFFIX_WAIVERS = [
  "analytics-react",
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
  overrides: [
    {
      files: PLATFORM_SUFFIX_WAIVERS.map(pkg => `${pkg}/**`),
      rules: { "suffix-imports/no-platform-suffix": "off" },
    },
  ],
});
