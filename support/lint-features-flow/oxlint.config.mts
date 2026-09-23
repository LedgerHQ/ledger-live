import { defineConfig } from "oxlint";
import base from "@support/lint-base";

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
        paths: ["lodash"],
        patterns: [
          {
            group: ["@ledgerhq/live-common/lib/**", "@ledgerhq/live-common/lib-es/**"],
            message: "Please remove the /lib import from live-common import.",
          },
        ],
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
