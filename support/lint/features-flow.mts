import { fileURLToPath } from "node:url";
import lumen from "@ledgerhq/lumen-lint-plugin/oxlint";
import { defineConfig } from "oxlint";
import base from "./base.mts";
import {
  BIGNUMBER_NAMED_IMPORT,
  EXPO_CLIPBOARD,
  LIVE_COMMON_LIB,
  LODASH,
  NAVIGATOR_CLIPBOARD,
} from "./restricted-imports.mts";
import { platformSuffixWaivers } from "./src/suffix-imports.js";

// Packages whose own config kept the React Compiler rules and `import/namespace` fatal. The rest
// of the layer has them as warnings and violates them today, so they stay fatal here only. Globs
// anchor to features/flow/, where the layer config re-exports this preset.
const FATAL_REACT_COMPILER = [
  "fear-and-greed",
  "market-banner",
  "pay-card",
  "pay-card-assets",
  "pay-card-auth",
  "pay-card-details",
  "pay-card-transactions",
  "pay-deposit",
];

// Packages that linted with `react/no-children-prop` off before this preset. Their test wrappers
// pass `children` in the props of `createElement(Provider, ...)`, which react-redux's types
// require. The rest of the layer had the rule fatal and keeps it.
const CHILDREN_PROP_IN_TESTS = ["flow-contacts-delete-contact", "flow-contacts-detail"];

const PLATFORM_SUFFIX_WAIVERS = [
  "account-detail",
  "account-detail-hero",
  "large-screen-upsell",
  "market-banner",
  "pay-bank-transfer",
  "pay-card-auth",
  "pay-card-widget",
  "pay-deposit",
  "pay-feature-tour",
  "pay-request",
];

const PLATFORM_STYLE = new URL("../../features/platform/style/", import.meta.url);

export default defineConfig({
  extends: [base],
  settings: {
    // better-tailwindcss resolves `tailwindcss` from `cwd`, which is wherever oxlint runs unless
    // set. The style package owns both the entry point and that dependency.
    "better-tailwindcss": {
      cwd: fileURLToPath(PLATFORM_STYLE),
      entryPoint: fileURLToPath(new URL("tailwind.css", PLATFORM_STYLE)),
    },
  },
  rules: {
    // features/flow is the strictest layer in the repo and wants `any` to be fatal.
    "typescript/no-explicit-any": "error",
    // Shadowing is idiomatic in the hook-heavy code here.
    "eslint/no-shadow": "off",
    "eslint/no-restricted-imports": [
      "error",
      {
        paths: [LODASH, EXPO_CLIPBOARD, BIGNUMBER_NAMED_IMPORT],
        patterns: [LIVE_COMMON_LIB],
      },
    ],
    "eslint/no-restricted-properties": ["error", NAVIGATOR_CLIPBOARD],
    "react-hooks/exhaustive-deps": [
      "error",
      {
        additionalHooks: "(useInViewContext|useAnimatedStyle|useDerivedValue|useAnimatedProps)",
      },
    ],
    // Test structure is fatal here, as every flow config had it.
    "jest/no-export": "error",
    "jest/no-standalone-expect": "error",
    "jest/valid-describe-callback": "error",
    "jest/valid-expect": "error",
    "suffix-imports/no-platform-suffix": "error",
  },
  overrides: [
    {
      files: FATAL_REACT_COMPILER.map(pkg => `${pkg}/**`),
      rules: {
        "import/namespace": "error",
        "react/globals": "error",
        "react/immutability": "error",
        "react/preserve-manual-memoization": "error",
        "react/purity": "error",
        "react/refs": "error",
        "react/set-state-in-effect": "error",
        "react/set-state-in-render": "error",
        "react/static-components": "error",
        "react/use-memo": "error",
      },
    },
    {
      files: CHILDREN_PROP_IN_TESTS.flatMap(pkg => [
        `${pkg}/**/*.test.{ts,tsx}`,
        `${pkg}/**/__tests__/**`,
      ]),
      rules: { "react/no-children-prop": "off" },
    },
    platformSuffixWaivers(PLATFORM_SUFFIX_WAIVERS),
    {
      // Tailwind only runs on web; native styles go through Lumen's RN components.
      files: ["**/*.web.{ts,tsx}"],
      jsPlugins: lumen.configs.recommended.jsPlugins,
      rules: {
        ...lumen.configs.recommended.rules,
        // `dark` is the Lumen color-scheme class toggled on <html> by ThemeProvider, not a utility.
        "better-tailwindcss/no-unknown-classes": ["error", { ignore: ["^dark$"] }],
      },
    },
  ],
});
