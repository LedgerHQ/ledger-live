import { defineConfig } from "oxlint";
import base from "./base.mts";

const CLIPBOARD_MESSAGE = "Use copyToClipboard / readClipboard from @shared/clipboard instead of";

export default defineConfig({
  extends: [base],
  rules: {
    // features/flow is the strictest layer in the repo and wants `any` to be fatal.
    "typescript/no-explicit-any": "error",
    // Shadowing is idiomatic in the hook-heavy code here.
    "eslint/no-shadow": "off",
    "eslint/no-restricted-imports": [
      "error",
      {
        paths: [
          "lodash",
          { name: "expo-clipboard", message: `${CLIPBOARD_MESSAGE} expo-clipboard.` },
        ],
        patterns: [
          {
            group: ["@ledgerhq/live-common/lib/**", "@ledgerhq/live-common/lib-es/**"],
            message: "Please remove the /lib import from live-common import.",
          },
        ],
      },
    ],
    "eslint/no-restricted-properties": [
      "error",
      {
        object: "navigator",
        property: "clipboard",
        message: `${CLIPBOARD_MESSAGE} navigator.clipboard.`,
      },
    ],
    "react-hooks/exhaustive-deps": [
      "error",
      {
        additionalHooks: "(useInViewContext|useAnimatedStyle|useDerivedValue|useAnimatedProps)",
      },
    ],
  },
});
